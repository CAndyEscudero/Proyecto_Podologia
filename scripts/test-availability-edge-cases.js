const assert = require("node:assert/strict");
const { getLocalEnv, requireLocalEnv } = require("./_shared/local-env");

process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { prisma } = require("../backend/src/config/prisma");
const { createAppointment, deleteAppointment } = require("../backend/src/modules/appointments/appointments.service");
const { getAvailableSlots } = require("../backend/src/modules/availability/availability.service");
const { AppError } = require("../backend/src/utils/app-error");

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

    if (availability.slots.length >= 3) {
      return {
        date,
        availability,
      };
    }
  }

  throw new Error("No se encontro una fecha con suficientes slots para ejecutar la prueba.");
}

async function run() {
  const service = await prisma.service.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  assert.ok(service, "No hay servicios activos para ejecutar la prueba.");

  const scenario = await findScenario(service.id);
  const testDate = scenario.date;
  const before = scenario.availability;

  const primarySlot = before.slots[0];
  const secondarySlot = before.slots[1];

  const createdRecords = {
    appointmentId: null,
    clientEmail: `edge.${Date.now()}@test.local`,
    blockedDateId: null,
  };

  try {
    const created = await createAppointment({
      serviceId: service.id,
      date: testDate,
      startTime: primarySlot.startTime,
      client: {
        firstName: "Edge",
        lastName: "Case",
        phone: `3462${String(Date.now()).slice(-6)}`,
        email: createdRecords.clientEmail,
        notes: "Prueba automatizada de edge cases.",
      },
    });

    createdRecords.appointmentId = created.appointment.id;

    const afterAppointment = await getAvailableSlots(service.id, testDate);
    assert.equal(
      afterAppointment.slots.some((slot) => slot.startTime === primarySlot.startTime),
      false,
      "El slot ocupado sigue apareciendo disponible despues de crear el turno."
    );

    await assert.rejects(
      () =>
        createAppointment({
          serviceId: service.id,
          date: testDate,
          startTime: primarySlot.startTime,
          client: {
            firstName: "Duplicado",
            lastName: "Reserva",
            phone: `3462${String(Date.now() + 1).slice(-6)}`,
            email: `duplicate.${Date.now()}@test.local`,
            notes: "Debe fallar por solapamiento.",
          },
        }),
      (error) => error instanceof AppError && error.statusCode === 409
    );

    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(testDate),
        startTime: secondarySlot.startTime,
        endTime: secondarySlot.endTime,
        reason: "Bloqueo automatizado edge case",
      },
    });

    createdRecords.blockedDateId = blockedDate.id;

    const afterBlockedDate = await getAvailableSlots(service.id, testDate);
    assert.equal(
      afterBlockedDate.slots.some((slot) => slot.startTime === secondarySlot.startTime),
      false,
      "El slot bloqueado sigue apareciendo disponible despues de crear el bloqueo parcial."
    );

    console.log(
      JSON.stringify(
        {
          checked: true,
          date: testDate,
          service: service.slug,
          appointmentSlotRemoved: primarySlot.startTime,
          blockedSlotRemoved: secondarySlot.startTime,
          remainingSlots: afterBlockedDate.slots.length,
        },
        null,
        2
      )
    );
  } finally {
    if (createdRecords.blockedDateId) {
      await prisma.blockedDate.delete({ where: { id: createdRecords.blockedDateId } });
    }

    if (createdRecords.appointmentId) {
      await deleteAppointment(createdRecords.appointmentId);
    }

    await prisma.client.deleteMany({
      where: { email: { in: [createdRecords.clientEmail] } },
    });

    await prisma.$disconnect();
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
