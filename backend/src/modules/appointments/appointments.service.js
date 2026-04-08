const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const { normalizeDate, overlaps, addMinutes } = require("../../utils/time");
const { getAvailabilityContext, getAvailableSlots } = require("../availability/availability.service");
const { upsertClientByEmailOrPhone } = require("../clients/clients.service");
const {
  buildPendingPaymentWindow,
  calculateDepositCents,
  createMercadoPagoPreference,
  expirePendingReservations,
} = require("../payments/payments.service");
const {
  sendCanceledAppointmentEmail,
  sendPendingPaymentReservationEmail,
  sendRescheduledAppointmentEmail,
} = require("../notifications/email.service");
const { buildReminderStateForAppointment } = require("../notifications/reminder-schedule.service");

async function assertSlotAvailable({ tenantId, serviceId, date, startTime, ignoredAppointmentId = null }) {
  const context = await getAvailabilityContext(tenantId, serviceId, date);
  const slotsSnapshot = await getAvailableSlots(tenantId, serviceId, date);
  const endTime = addMinutes(startTime, context.service.durationMin + (context.settings?.appointmentGapMin || 0));

  const allowedSlot = slotsSnapshot.slots.find((slot) => slot.startTime === startTime);

  if (!allowedSlot) {
    throw new AppError("El horario seleccionado esta fuera de la disponibilidad vigente", 409);
  }

  const conflictingAppointment = context.appointments.find((appointment) => {
    if (ignoredAppointmentId && appointment.id === Number(ignoredAppointmentId)) {
      return false;
    }

    return overlaps(startTime, endTime, appointment.startTime, appointment.endTime);
  });

  if (conflictingAppointment) {
    throw new AppError("El horario seleccionado ya no esta disponible", 409);
  }

  return {
    normalizedDate: context.normalizedDate,
    service: context.service,
    settings: context.settings,
    endTime,
  };
}

function serializeAppointment(appointment) {
  return {
    ...appointment,
    date: normalizeDate(appointment.date),
    paymentApprovedAt: appointment.paymentApprovedAt
      ? appointment.paymentApprovedAt.toISOString()
      : null,
    paymentExpiresAt: appointment.paymentExpiresAt
      ? appointment.paymentExpiresAt.toISOString()
      : null,
  };
}

async function createAppointment(tenantId, payload) {
  const { normalizedDate, service, endTime } = await assertSlotAvailable({
    ...payload,
    tenantId,
  });
  const client = await upsertClientByEmailOrPhone(tenantId, payload.client);

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      clientId: client.id,
      serviceId: service.id,
      date: new Date(normalizedDate),
      startTime: payload.startTime,
      endTime,
      notes: payload.client.notes || null,
      status: "PENDING",
      ...buildReminderStateForAppointment({
        date: normalizedDate,
        startTime: payload.startTime,
        status: "PENDING",
      }),
    },
    include: {
      client: true,
      service: true,
    },
  });

  return {
    message: "Turno creado correctamente",
    appointment: serializeAppointment(appointment),
  };
}

function hasScheduleChanged(current, next) {
  return (
    normalizeDate(current.date) !== normalizeDate(next.date) ||
    current.startTime !== next.startTime
  );
}

function buildReminderStatePatch(current, next) {
  const nextStatus = next.status ?? current.status;
  const nextDate = next.date ?? current.date;
  const nextStartTime = next.startTime ?? current.startTime;
  const reminderRelevantChanged =
    nextStatus !== current.status ||
    normalizeDate(nextDate) !== normalizeDate(current.date) ||
    nextStartTime !== current.startTime;

  if (!reminderRelevantChanged) {
    return {};
  }

  return buildReminderStateForAppointment({
    date: nextDate,
    startTime: nextStartTime,
    status: nextStatus,
  });
}

async function createPaymentReservation(tenantId, payload) {
  const { normalizedDate, service, settings, endTime } = await assertSlotAvailable({
    ...payload,
    tenantId,
  });

  if (!service.priceCents || service.priceCents <= 0) {
    throw new AppError(
      "Este servicio no tiene precio configurado para reserva online. Contactanos por WhatsApp.",
      409
    );
  }

  const depositCents = calculateDepositCents(service.priceCents, settings?.depositPercentage);

  if (!depositCents) {
    throw new AppError("No se pudo calcular la seña del servicio seleccionado", 409);
  }

  const client = await upsertClientByEmailOrPhone(tenantId, payload.client);
  const paymentExpiresAt = buildPendingPaymentWindow(15);

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      clientId: client.id,
      serviceId: service.id,
      date: new Date(normalizedDate),
      startTime: payload.startTime,
      endTime,
      notes: payload.client.notes || null,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentOption: "DEPOSIT",
      paymentProvider: "mercado_pago",
      priceCents: service.priceCents,
      depositCents,
      paymentExpiresAt,
      source: "web_payment",
      ...buildReminderStateForAppointment({
        date: normalizedDate,
        startTime: payload.startTime,
        status: "PENDING",
      }),
    },
    include: {
      client: true,
      service: true,
    },
  });

  const paymentPreference = await createMercadoPagoPreference({
    appointment,
    client,
    service,
  });

  const refreshedAppointment = await prisma.appointment.findFirst({
    where: {
      id: appointment.id,
      tenantId,
    },
    include: {
      client: true,
      service: true,
    },
  });

  await sendPendingPaymentReservationEmail({
    tenantId,
    appointmentId: refreshedAppointment.id,
    checkoutUrl: paymentPreference.checkoutUrl,
  });

  return {
    message: "Reserva pendiente de pago creada correctamente",
    appointment: serializeAppointment(refreshedAppointment),
    paymentSummary: {
      priceCents: refreshedAppointment.priceCents,
      depositCents: refreshedAppointment.depositCents,
      paymentStatus: refreshedAppointment.paymentStatus,
      paymentOption: refreshedAppointment.paymentOption,
      paymentExpiresAt: refreshedAppointment.paymentExpiresAt
        ? refreshedAppointment.paymentExpiresAt.toISOString()
        : null,
    },
    checkoutUrl: paymentPreference.checkoutUrl,
    paymentOption: refreshedAppointment.paymentOption,
  };
}

async function listAppointments(tenantId, filters) {
  await expirePendingReservations(tenantId);

  const where = { tenantId };

  if (filters.date) {
    where.date = new Date(normalizeDate(filters.date));
  } else if (filters.dateFrom || filters.dateTo) {
    where.date = {};

    if (filters.dateFrom) {
      where.date.gte = new Date(normalizeDate(filters.dateFrom));
    }

    if (filters.dateTo) {
      where.date.lte = new Date(normalizeDate(filters.dateTo));
    }
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.serviceId) {
    where.serviceId = Number(filters.serviceId);
  }

  if (filters.client) {
    where.client = {
      OR: [
        { firstName: { contains: filters.client } },
        { lastName: { contains: filters.client } },
        { phone: { contains: filters.client } },
        { email: { contains: filters.client } },
      ],
    };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client: true,
      service: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return appointments.map(serializeAppointment);
}

async function getAppointmentById(tenantId, id) {
  await expirePendingReservations(tenantId);

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
    include: {
      client: true,
      service: true,
    },
  });

  if (!appointment) {
    throw new AppError("Turno no encontrado", 404);
  }

  return serializeAppointment(appointment);
}

async function updateAppointment(tenantId, id, data) {
  const current = await prisma.appointment.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
    include: { client: true },
  });

  if (!current) {
    throw new AppError("Turno no encontrado", 404);
  }

  const clientData = data.client
    ? {
        firstName: data.client.firstName ?? current.client.firstName,
        lastName: data.client.lastName ?? current.client.lastName,
        phone: data.client.phone ?? current.client.phone,
        email:
          data.client.email === ""
            ? null
            : data.client.email ?? current.client.email,
        notes:
          data.client.notes === undefined
            ? current.client.notes
            : data.client.notes || null,
      }
    : null;

  const appointmentData = {};

  if (data.status) {
    appointmentData.status = data.status;
  }

  if (Object.prototype.hasOwnProperty.call(data, "notes")) {
    appointmentData.notes = data.notes || null;
  }

  if (Object.prototype.hasOwnProperty.call(data, "date")) {
    appointmentData.date = new Date(normalizeDate(data.date));
  }

  if (Object.prototype.hasOwnProperty.call(data, "startTime")) {
    appointmentData.startTime = data.startTime;
  }

  if (Object.prototype.hasOwnProperty.call(data, "endTime")) {
    appointmentData.endTime = data.endTime;
  }

  Object.assign(
    appointmentData,
    buildReminderStatePatch(current, {
      status: appointmentData.status,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
    })
  );

  const previousSchedule = hasScheduleChanged(current, {
    date: appointmentData.date || current.date,
    startTime: appointmentData.startTime || current.startTime,
    endTime: appointmentData.endTime || current.endTime,
  })
    ? {
        date: normalizeDate(current.date),
        startTime: current.startTime,
      }
    : null;

  const operations = [];

  if (clientData) {
    operations.push(
      prisma.client.update({
        where: { id: current.clientId },
        data: clientData,
      })
    );
  }

  operations.push(
    prisma.appointment.update({
      where: { id: Number(id) },
      data: appointmentData,
      include: { client: true, service: true },
    })
  );

  const transactionResults = await prisma.$transaction(operations);
  const appointment = transactionResults[transactionResults.length - 1];

  if (appointment.status === "CANCELED" && current.status !== "CANCELED") {
    await sendCanceledAppointmentEmail({
      tenantId,
      appointmentId: appointment.id,
    });
  } else if (previousSchedule && appointment.status !== "CANCELED") {
    await sendRescheduledAppointmentEmail({
      tenantId,
      appointmentId: appointment.id,
      previousSchedule,
    });
  }

  return serializeAppointment(appointment);
}

async function updateAppointmentStatus(tenantId, id, status) {
  return updateAppointment(tenantId, id, { status });
}

async function rescheduleAppointment(tenantId, id, date, startTime) {
  const current = await prisma.appointment.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });

  if (!current) {
    throw new AppError("Turno no encontrado", 404);
  }

  const validation = await assertSlotAvailable({
    tenantId,
    serviceId: current.serviceId,
    date,
    startTime,
    ignoredAppointmentId: id,
  });

  return updateAppointment(tenantId, id, {
    date: new Date(validation.normalizedDate),
    startTime,
    endTime: validation.endTime,
  });
}

async function deleteAppointment(tenantId, id) {
  const current = await prisma.appointment.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });
  if (!current) {
    throw new AppError("Turno no encontrado", 404);
  }
  if (current.status !== "CANCELED") {
    await sendCanceledAppointmentEmail({
      tenantId,
      appointmentId: current.id,
    });
  }
  await prisma.appointment.delete({ where: { id: Number(id) } });
}

module.exports = {
  createAppointment,
  createPaymentReservation,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  rescheduleAppointment,
  updateAppointment,
  updateAppointmentStatus,
};
