const assert = require("node:assert/strict");
const { getLocalEnv, requireLocalEnv } = require("./_shared/local-env");

process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { prisma } = require("../backend/src/config/prisma");
const {
  createAppointment,
  deleteAppointment,
  rescheduleAppointment,
} = require("../backend/src/modules/appointments/appointments.service");
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

    if (availability.slots.length >= 6) {
      return { date, availability };
    }
  }

  throw new Error("No se encontro una fecha con suficientes slots para probar reprogramacion.");
}

function makeClient(seed) {
  const stamp = `${Date.now()}${seed}`;
  return {
    firstName: "Repro",
    lastName: `Caso ${seed}`,
    phone: `3462${stamp.slice(-6)}`,
    email: `repro.${stamp}@test.local`,
    notes: "Prueba automatizada de reprogramacion.",
  };
}

async function run() {
  const service = await prisma.service.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  assert.ok(service, "No hay servicios activos para ejecutar la prueba.");

  const { date } = await findScenario(service.id);

  const created = {
    primaryAppointmentId: null,
    secondaryAppointmentId: null,
    blockedDateId: null,
    clientEmails: [],
  };

  try {
    const before = await getAvailableSlots(service.id, date);
    assert.ok(before.slots.length >= 6, "La fecha elegida no tiene suficientes slots iniciales.");

    const primarySlot = before.slots[0];
    const primaryClient = makeClient("a");
    created.clientEmails.push(primaryClient.email);

    const primary = await createAppointment({
      serviceId: service.id,
      date,
      startTime: primarySlot.startTime,
      client: primaryClient,
    });
    created.primaryAppointmentId = primary.appointment.id;

    const afterPrimary = await getAvailableSlots(service.id, date);
    const occupiedTarget = afterPrimary.slots[0];
    assert.ok(occupiedTarget, "No se encontro un slot libre para crear el segundo turno.");

    const secondaryClient = makeClient("b");
    created.clientEmails.push(secondaryClient.email);

    const secondary = await createAppointment({
      serviceId: service.id,
      date,
      startTime: occupiedTarget.startTime,
      client: secondaryClient,
    });
    created.secondaryAppointmentId = secondary.appointment.id;

    await assert.rejects(
      () => rescheduleAppointment(created.primaryAppointmentId, date, occupiedTarget.startTime),
      (error) => error instanceof AppError && error.statusCode === 409,
      "La reprogramacion a un slot ocupado deberia fallar."
    );

    const afterSecondary = await getAvailableSlots(service.id, date);
    const blockedTarget = afterSecondary.slots[0];
    assert.ok(blockedTarget, "No se encontro un slot libre para crear el bloqueo parcial.");

    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(date),
        startTime: blockedTarget.startTime,
        endTime: blockedTarget.endTime,
        reason: "Bloqueo automatizado para reprogramacion",
      },
    });
    created.blockedDateId = blockedDate.id;

    await assert.rejects(
      () => rescheduleAppointment(created.primaryAppointmentId, date, blockedTarget.startTime),
      (error) => error instanceof AppError && error.statusCode === 409,
      "La reprogramacion a un slot bloqueado deberia fallar."
    );

    const afterBlocked = await getAvailableSlots(service.id, date);
    const validTarget = afterBlocked.slots.find(
      (slot) =>
        slot.startTime !== occupiedTarget.startTime &&
        slot.startTime !== blockedTarget.startTime &&
        slot.startTime !== primarySlot.startTime
    );

    assert.ok(validTarget, "No se encontro un slot libre valido para completar la reprogramacion.");

    const rescheduled = await rescheduleAppointment(created.primaryAppointmentId, date, validTarget.startTime);

    assert.equal(rescheduled.startTime, validTarget.startTime, "El turno no quedo reprogramado al horario esperado.");
    assert.equal(rescheduled.endTime, validTarget.endTime, "El endTime recalculado no coincide con la disponibilidad.");
    assert.equal(rescheduled.date, date, "La fecha reprogramada no coincide con la solicitada.");

    console.log(
      JSON.stringify(
        {
          checked: true,
          date,
          service: service.slug,
          rejectedOccupiedSlot: occupiedTarget.startTime,
          rejectedBlockedSlot: blockedTarget.startTime,
          successfulReschedule: `${rescheduled.startTime} - ${rescheduled.endTime}`,
        },
        null,
        2
      )
    );
  } finally {
    if (created.blockedDateId) {
      await prisma.blockedDate.delete({ where: { id: created.blockedDateId } });
    }

    if (created.secondaryAppointmentId) {
      await deleteAppointment(created.secondaryAppointmentId);
    }

    if (created.primaryAppointmentId) {
      await deleteAppointment(created.primaryAppointmentId);
    }

    if (created.clientEmails.length) {
      await prisma.client.deleteMany({
        where: { email: { in: created.clientEmails } },
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
