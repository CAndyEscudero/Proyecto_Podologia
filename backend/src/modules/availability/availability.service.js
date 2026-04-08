const dayjs = require("dayjs");
const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const { addMinutes, isPastSlotForDate, normalizeDate, overlaps, toMinutes } = require("../../utils/time");
const { expirePendingReservations } = require("../payments/payments.service");

function validateBookingDate(normalizedDate, settings) {
  const requestedDate = dayjs(normalizedDate);
  const today = dayjs().startOf("day");
  const bookingWindowDays = settings?.bookingWindowDays || 45;
  const maxDate = today.add(bookingWindowDays, "day");

  if (requestedDate.isBefore(today, "day")) {
    throw new AppError("No se permiten reservas en fechas pasadas", 422);
  }

  if (requestedDate.isAfter(maxDate, "day")) {
    throw new AppError("La fecha seleccionada esta fuera de la ventana disponible para reservas", 422);
  }
}

async function getAvailabilityContext(tenantId, serviceId, date) {
  await expirePendingReservations(tenantId);

  const normalizedDate = normalizeDate(date);
  const service = await prisma.service.findFirst({
    where: {
      id: Number(serviceId),
      tenantId,
    },
  });

  if (!service || !service.isActive) {
    throw new AppError("Servicio no disponible", 404);
  }

  const weekday = dayjs(normalizedDate).day();
  const [settings, rules, blockedDates, appointments] = await Promise.all([
    prisma.businessSettings.findFirst({
      where: { tenantId },
    }),
    prisma.availabilityRule.findMany({
      where: {
        tenantId,
        dayOfWeek: weekday,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedDate.findMany({
      where: {
        tenantId,
        date: new Date(normalizedDate),
      },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        date: new Date(normalizedDate),
        status: { not: "CANCELED" },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  validateBookingDate(normalizedDate, settings);

  return { normalizedDate, service, settings, rules, blockedDates, appointments };
}

function isInsideWorkingPeriod(slotStart, slotEnd, workingPeriods, breakPeriods, blockedDates) {
  const insideWorking = workingPeriods.some(
    (period) => toMinutes(slotStart) >= toMinutes(period.startTime) && toMinutes(slotEnd) <= toMinutes(period.endTime)
  );

  if (!insideWorking) {
    return false;
  }

  const collidesWithBreak = breakPeriods.some((period) =>
    overlaps(slotStart, slotEnd, period.startTime, period.endTime)
  );

  if (collidesWithBreak) {
    return false;
  }

  const collidesWithBlockedDate = blockedDates.some((blocked) => {
    if (!blocked.startTime || !blocked.endTime) {
      return true;
    }

    return overlaps(slotStart, slotEnd, blocked.startTime, blocked.endTime);
  });

  return !collidesWithBlockedDate;
}

async function getAvailableSlots(tenantId, serviceId, date) {
  const context = await getAvailabilityContext(tenantId, serviceId, date);
  const workingPeriods = context.rules.filter((rule) => rule.type === "WORKING_HOURS");
  const breakPeriods = context.rules.filter((rule) => rule.type === "BREAK");
  const slotStep = 15;
  const gap = context.settings?.appointmentGapMin || 0;
  const result = [];

  for (const period of workingPeriods) {
    for (
      let cursor = toMinutes(period.startTime);
      cursor + context.service.durationMin <= toMinutes(period.endTime);
      cursor += slotStep
    ) {
      const startTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      const endTime = addMinutes(startTime, context.service.durationMin + gap);

      if (isPastSlotForDate(context.normalizedDate, startTime)) {
        continue;
      }

      const availableByRule = isInsideWorkingPeriod(
        startTime,
        endTime,
        workingPeriods,
        breakPeriods,
        context.blockedDates
      );

      if (!availableByRule) {
        continue;
      }

      const overlapsWithAppointments = context.appointments.some((appointment) =>
        overlaps(startTime, endTime, appointment.startTime, appointment.endTime)
      );

      if (!overlapsWithAppointments) {
        result.push({
          startTime,
          endTime,
        });
      }
    }
  }

  return {
    date: context.normalizedDate,
    service: {
      id: context.service.id,
      name: context.service.name,
      durationMin: context.service.durationMin,
    },
    slots: result,
  };
}

async function getRuleOrThrow(tenantId, id) {
  const rule = await prisma.availabilityRule.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });

  if (!rule) {
    throw new AppError("Regla de disponibilidad no encontrada", 404);
  }

  return rule;
}

function listRules(tenantId) {
  return prisma.availabilityRule.findMany({
    where: { tenantId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

function createRule(tenantId, data) {
  return prisma.availabilityRule.create({
    data: {
      tenantId,
      ...data,
    },
  });
}

async function updateRule(tenantId, id, data) {
  await getRuleOrThrow(tenantId, id);

  return prisma.availabilityRule.update({ where: { id: Number(id) }, data });
}

async function deleteRule(tenantId, id) {
  await getRuleOrThrow(tenantId, id);

  return prisma.availabilityRule.delete({ where: { id: Number(id) } });
}

async function getBlockedDateOrThrow(tenantId, id) {
  const blockedDate = await prisma.blockedDate.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });

  if (!blockedDate) {
    throw new AppError("Bloqueo de fecha no encontrado", 404);
  }

  return blockedDate;
}

function listBlockedDates(tenantId) {
  return prisma.blockedDate.findMany({
    where: { tenantId },
    orderBy: { date: "asc" },
  });
}

function createBlockedDate(tenantId, data) {
  return prisma.blockedDate.create({
    data: {
      tenantId,
      ...data,
      date: new Date(normalizeDate(data.date)),
    },
  });
}

async function deleteBlockedDate(tenantId, id) {
  await getBlockedDateOrThrow(tenantId, id);

  return prisma.blockedDate.delete({ where: { id: Number(id) } });
}

module.exports = {
  createBlockedDate,
  createRule,
  deleteBlockedDate,
  deleteRule,
  getAvailabilityContext,
  getAvailableSlots,
  listBlockedDates,
  listRules,
  updateRule,
};
