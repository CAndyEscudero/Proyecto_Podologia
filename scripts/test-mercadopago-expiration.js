const assert = require("node:assert/strict");
const { getLocalEnv, requireLocalEnv } = require("./_shared/local-env");

process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { prisma } = require("../backend/src/config/prisma");
const { getAvailableSlots } = require("../backend/src/modules/availability/availability.service");
const { expirePendingReservations } = require("../backend/src/modules/payments/payments.service");

function findNextBusinessDate(targetWeekday) {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  const maxCursor = new Date(cursor);
  maxCursor.setDate(maxCursor.getDate() + Number(getLocalEnv("BOOKING_WINDOW_DAYS") || 45));

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

    if (availability.slots.length > 0) {
      return { date, slot: availability.slots[0] };
    }
  }

  throw new Error("No se encontro una fecha con disponibilidad para probar vencimientos.");
}

async function run() {
  const service = await prisma.service.findFirst({
    where: { isActive: true, priceCents: { gt: 0 } },
    orderBy: { id: "asc" },
  });

  assert.ok(service, "No hay servicios activos con precio para probar vencimientos.");

  const { date, slot } = await findScenario(service.id);
  const stamp = Date.now();
  let clientId = null;
  let appointmentId = null;

  try {
    const client = await prisma.client.create({
      data: {
        firstName: "Pago",
        lastName: "Vencido",
        phone: `3462${String(stamp).slice(-6)}`,
        email: `expira.${stamp}@test.local`,
        notes: "Prueba automatizada de vencimiento.",
      },
    });
    clientId = client.id;

    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        date: new Date(date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentOption: "DEPOSIT",
        paymentProvider: "mercado_pago",
        priceCents: service.priceCents,
        depositCents: Math.ceil(service.priceCents * 0.5),
        paymentExpiresAt: new Date(Date.now() - 5 * 60 * 1000),
        source: "web_payment",
      },
    });
    appointmentId = appointment.id;

    await expirePendingReservations();

    const refreshed = await prisma.appointment.findUnique({
      where: { id: appointment.id },
    });

    assert.equal(refreshed.status, "CANCELED", "La reserva vencida deberia quedar cancelada.");
    assert.equal(refreshed.paymentStatus, "EXPIRED", "El pago vencido deberia quedar marcado como EXPIRED.");

    const availability = await getAvailableSlots(service.id, date);
    assert.equal(
      availability.slots.some((availableSlot) => availableSlot.startTime === slot.startTime),
      true,
      "El horario vencido deberia volver a aparecer disponible."
    );

    console.log(
      JSON.stringify(
        {
          checked: true,
          service: service.slug,
          date,
          releasedSlot: `${slot.startTime}-${slot.endTime}`,
          paymentStatus: refreshed.paymentStatus,
        },
        null,
        2
      )
    );
  } finally {
    if (appointmentId) {
      await prisma.appointment.deleteMany({ where: { id: appointmentId } });
    }

    if (clientId) {
      await prisma.client.deleteMany({ where: { id: clientId } });
    }

    await prisma.$disconnect();
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
