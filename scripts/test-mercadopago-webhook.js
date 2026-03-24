const assert = require("node:assert/strict");
const { getLocalEnv, requireLocalEnv } = require("./_shared/local-env");

process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { prisma } = require("../backend/src/config/prisma");
const { processMercadoPagoWebhook } = require("../backend/src/modules/payments/payments.service");
const { getAvailableSlots } = require("../backend/src/modules/availability/availability.service");

function findNextBusinessDate(targetWeekday) {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  const maxCursor = new Date(cursor);
  maxCursor.setDate(cursor.getDate() + Number(getLocalEnv("BOOKING_WINDOW_DAYS") || 45));

  while (cursor.getTime() <= maxCursor.getTime()) {
    if (cursor.getDay() === targetWeekday) {
      return cursor.toISOString().slice(0, 10);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  throw new Error("No se encontro una fecha habil dentro de la ventana de reserva.");
}

async function findScenario(serviceId) {
  for (const weekday of [1, 2, 3, 4, 5]) {
    const date = findNextBusinessDate(weekday);
    const availability = await getAvailableSlots(serviceId, date);

    if (availability.slots.length >= 2) {
      return { date, slots: availability.slots.slice(0, 2) };
    }
  }

  throw new Error("No se encontro una fecha con suficientes horarios para probar el webhook.");
}

function createFetchMock(paymentFactory) {
  return async function fetchMock(url) {
    if (String(url).includes("/v1/payments/")) {
      return {
        ok: true,
        json: async () => paymentFactory(url),
      };
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };
}

async function run() {
  const service = await prisma.service.findFirst({
    where: { isActive: true, priceCents: { gt: 0 } },
    orderBy: { id: "asc" },
  });

  assert.ok(service, "No hay servicios activos con precio para probar el webhook.");

  const { date, slots } = await findScenario(service.id);
  const stamp = Date.now();
  const createdAppointments = [];
  const clientIds = [];
  const originalFetch = global.fetch;

  try {
    const primaryClient = await prisma.client.create({
      data: {
        firstName: "Webhook",
        lastName: "Aprobado",
        phone: `3462${String(stamp).slice(-6)}`,
        email: `webhook.${stamp}@test.local`,
      },
    });
    clientIds.push(primaryClient.id);

    const primaryAppointment = await prisma.appointment.create({
      data: {
        clientId: primaryClient.id,
        serviceId: service.id,
        date: new Date(date),
        startTime: slots[0].startTime,
        endTime: slots[0].endTime,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentOption: "DEPOSIT",
        paymentProvider: "mercado_pago",
        priceCents: service.priceCents,
        depositCents: Math.ceil(service.priceCents * 0.5),
        paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        source: "web_payment",
      },
    });
    createdAppointments.push(primaryAppointment.id);

    global.fetch = createFetchMock(() => ({
      id: 900001,
      status: "approved",
      date_approved: new Date().toISOString(),
      external_reference: `appointment:${primaryAppointment.id}`,
    }));

    const approvedResult = await processMercadoPagoWebhook({
      type: "payment",
      data: { id: "900001" },
    });

    const approvedAppointment = await prisma.appointment.findUnique({
      where: { id: primaryAppointment.id },
    });

    assert.equal(approvedResult.manualReview, undefined, "Un pago aprobado dentro de ventana no deberia requerir revision manual.");
    assert.equal(approvedAppointment.status, "CONFIRMED", "El webhook aprobado deberia confirmar el turno.");
    assert.equal(approvedAppointment.paymentStatus, "APPROVED", "El webhook aprobado deberia marcar APPROVED.");
    assert.equal(approvedAppointment.paymentReference, "900001", "La referencia de pago deberia guardarse.");

    const lateClient = await prisma.client.create({
      data: {
        firstName: "Webhook",
        lastName: "Tardio",
        phone: `3463${String(stamp).slice(-6)}`,
        email: `late.${stamp}@test.local`,
      },
    });
    clientIds.push(lateClient.id);

    const lateAppointment = await prisma.appointment.create({
      data: {
        clientId: lateClient.id,
        serviceId: service.id,
        date: new Date(date),
        startTime: slots[1].startTime,
        endTime: slots[1].endTime,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentOption: "DEPOSIT",
        paymentProvider: "mercado_pago",
        priceCents: service.priceCents,
        depositCents: Math.ceil(service.priceCents * 0.5),
        paymentExpiresAt: new Date(Date.now() - 2 * 60 * 1000),
        source: "web_payment",
      },
    });
    createdAppointments.push(lateAppointment.id);

    global.fetch = createFetchMock(() => ({
      id: 900002,
      status: "approved",
      date_approved: new Date().toISOString(),
      external_reference: `appointment:${lateAppointment.id}`,
    }));

    const lateResult = await processMercadoPagoWebhook({
      type: "payment",
      data: { id: "900002" },
    });

    const lateApprovedAppointment = await prisma.appointment.findUnique({
      where: { id: lateAppointment.id },
    });

    assert.equal(lateResult.manualReview, true, "Un pago aprobado fuera de ventana deberia quedar para revision manual.");
    assert.equal(lateApprovedAppointment.status, "CANCELED", "El turno tardio no deberia reconfirmarse automaticamente.");
    assert.equal(lateApprovedAppointment.paymentStatus, "APPROVED", "El pago tardio deberia quedar registrado como aprobado.");

    console.log(
      JSON.stringify(
        {
          checked: true,
          service: service.slug,
          confirmedAppointmentId: primaryAppointment.id,
          lateReviewAppointmentId: lateAppointment.id,
        },
        null,
        2
      )
    );
  } finally {
    global.fetch = originalFetch;

    if (createdAppointments.length) {
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointments } },
      });
    }

    if (clientIds.length) {
      await prisma.client.deleteMany({
        where: { id: { in: clientIds } },
      });
    }

    await prisma.$disconnect();
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
