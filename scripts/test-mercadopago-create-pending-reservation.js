const assert = require("node:assert/strict");
const { getLocalEnv, requireLocalEnv } = require("./_shared/local-env");

process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN || getLocalEnv("MP_ACCESS_TOKEN") || "test-access-token";
process.env.API_BASE_URL = process.env.API_BASE_URL || getLocalEnv("API_BASE_URL") || "http://localhost:4000";

const { prisma } = require("../backend/src/config/prisma");
const { createPaymentReservation } = require("../backend/src/modules/appointments/appointments.service");
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

    if (availability.slots.length > 0) {
      return { date, slot: availability.slots[0] };
    }
  }

  throw new Error("No se encontro una fecha con disponibilidad para crear una reserva pendiente.");
}

async function run() {
  const service = await prisma.service.findFirst({
    where: { isActive: true, priceCents: { gt: 0 } },
    orderBy: { id: "asc" },
  });

  assert.ok(service, "No hay servicios activos con precio para probar la reserva pendiente.");

  const { date, slot } = await findScenario(service.id);
  const stamp = Date.now();
  const originalFetch = global.fetch;
  let appointmentId = null;
  let clientEmail = null;

  try {
    global.fetch = async (url) => {
      if (String(url).includes("/checkout/preferences")) {
        return {
          ok: true,
          json: async () => ({
            id: "pref_test_pending_001",
            init_point: "https://example.test/mercadopago/checkout/pref_test_pending_001",
          }),
        };
      }

      throw new Error(`Unexpected fetch URL in test: ${url}`);
    };

    clientEmail = `pending.reservation.${stamp}@test.local`;

    const result = await createPaymentReservation({
      serviceId: service.id,
      date,
      startTime: slot.startTime,
      client: {
        firstName: "Reserva",
        lastName: "Pendiente",
        phone: `3462${String(stamp).slice(-6)}`,
        email: clientEmail,
        notes: "Prueba automatizada de reserva pendiente.",
      },
    });

    appointmentId = result.appointment.id;

    assert.equal(result.message.includes("pendiente"), true, "La respuesta deberia indicar reserva pendiente.");
    assert.equal(result.appointment.status, "PENDING", "El turno deberia crearse en PENDING.");
    assert.equal(result.appointment.paymentStatus, "PENDING", "El pago deberia quedar en PENDING.");
    assert.equal(result.appointment.paymentOption, "DEPOSIT", "La opcion de pago deberia ser DEPOSIT.");
    assert.equal(result.appointment.paymentProvider, "mercado_pago", "El proveedor deberia ser Mercado Pago.");
    assert.equal(result.paymentSummary.depositCents, Math.ceil(service.priceCents * 0.5), "La sena deberia ser el 50% redondeado hacia arriba.");
    assert.equal(
      result.checkoutUrl,
      "https://example.test/mercadopago/checkout/pref_test_pending_001",
      "La URL de checkout deberia devolverse al frontend."
    );
    assert.ok(result.paymentSummary.paymentExpiresAt, "La reserva pendiente deberia devolver un vencimiento.");

    const persistedAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
      },
    });

    assert.ok(persistedAppointment, "El turno deberia persistirse en la base.");
    assert.equal(persistedAppointment.paymentPreferenceId, "pref_test_pending_001", "La preferencia de pago deberia guardarse.");
    assert.equal(persistedAppointment.client.email, clientEmail, "El cliente deberia quedar asociado correctamente.");
    assert.equal(persistedAppointment.service.id, service.id, "El servicio asociado deberia ser el esperado.");

    console.log(
      JSON.stringify(
        {
          checked: true,
          service: service.slug,
          appointmentId,
          date,
          startTime: slot.startTime,
          checkoutUrl: result.checkoutUrl,
          paymentPreferenceId: persistedAppointment.paymentPreferenceId,
          depositCents: result.paymentSummary.depositCents,
        },
        null,
        2
      )
    );
  } finally {
    global.fetch = originalFetch;

    if (appointmentId) {
      await prisma.appointment.deleteMany({ where: { id: appointmentId } });
    }

    if (clientEmail) {
      await prisma.client.deleteMany({ where: { email: clientEmail } });
    }

    await prisma.$disconnect();
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
