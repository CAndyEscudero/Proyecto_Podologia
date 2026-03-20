const assert = require("node:assert/strict");
const { getLocalEnv, requireLocalEnv } = require("./_shared/local-env");

process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { prisma } = require("../backend/src/config/prisma");
const { getAvailableSlots } = require("../backend/src/modules/availability/availability.service");
const { AppError } = require("../backend/src/utils/app-error");

function addDays(baseDate, days) {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function findNextWeekday(targetWeekday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 1; offset <= Number(getLocalEnv("BOOKING_WINDOW_DAYS") || 45); offset += 1) {
    const candidate = addDays(today, offset);
    if (candidate.getDay() === targetWeekday) {
      return toDateString(candidate);
    }
  }

  throw new Error("No se encontro una fecha habil dentro de la ventana de reserva.");
}

async function findReservableDate(serviceId) {
  for (const weekday of [1, 2, 3, 4, 5]) {
    const date = findNextWeekday(weekday);
    const availability = await getAvailableSlots(serviceId, date);

    if (availability.slots.length > 0) {
      return { date, availability };
    }
  }

  throw new Error("No se encontro una fecha con disponibilidad para ejecutar la prueba.");
}

async function run() {
  const service = await prisma.service.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  assert.ok(service, "No hay servicios activos para ejecutar la prueba.");

  const { date, availability } = await findReservableDate(service.id);
  assert.ok(availability.slots.length > 0, "La fecha elegida deberia tener disponibilidad inicial.");

  let blockedDateId = null;

  try {
    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(date),
        reason: "Bloqueo total automatizado",
      },
    });

    blockedDateId = blockedDate.id;

    const afterFullBlock = await getAvailableSlots(service.id, date);
    assert.equal(afterFullBlock.slots.length, 0, "El bloqueo total del dia deberia dejar la agenda sin slots.");

    const bookingWindowDays = Number(getLocalEnv("BOOKING_WINDOW_DAYS") || 45);
    const outsideWindowDate = toDateString(addDays(new Date(), bookingWindowDays + 2));

    await assert.rejects(
      () => getAvailableSlots(service.id, outsideWindowDate),
      (error) =>
        error instanceof AppError &&
        error.statusCode === 422 &&
        error.message.includes("fuera de la ventana"),
      "Una fecha fuera de la ventana de reserva deberia devolver error 422."
    );

    console.log(
      JSON.stringify(
        {
          checked: true,
          service: service.slug,
          blockedDate: date,
          slotsBeforeBlock: availability.slots.length,
          slotsAfterFullBlock: afterFullBlock.slots.length,
          outsideWindowRejected: outsideWindowDate,
        },
        null,
        2
      )
    );
  } finally {
    if (blockedDateId) {
      await prisma.blockedDate.delete({ where: { id: blockedDateId } });
    }

    await prisma.$disconnect();
  }
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
