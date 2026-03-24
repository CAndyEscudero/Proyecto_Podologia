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

async function assertSlotAvailable({ serviceId, date, startTime, ignoredAppointmentId = null }) {
  const context = await getAvailabilityContext(serviceId, date);
  const slotsSnapshot = await getAvailableSlots(serviceId, date);
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

async function createAppointment(payload) {
  const { normalizedDate, service, endTime } = await assertSlotAvailable(payload);
  const client = await upsertClientByEmailOrPhone(payload.client);

  const appointment = await prisma.appointment.create({
    data: {
      clientId: client.id,
      serviceId: service.id,
      date: new Date(normalizedDate),
      startTime: payload.startTime,
      endTime,
      notes: payload.client.notes || null,
      status: "PENDING",
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

async function createPaymentReservation(payload) {
  const { normalizedDate, service, endTime } = await assertSlotAvailable(payload);

  if (!service.priceCents || service.priceCents <= 0) {
    throw new AppError(
      "Este servicio no tiene precio configurado para reserva online. Contactanos por WhatsApp.",
      409
    );
  }

  const depositCents = calculateDepositCents(service.priceCents);

  if (!depositCents) {
    throw new AppError("No se pudo calcular la seña del servicio seleccionado", 409);
  }

  const client = await upsertClientByEmailOrPhone(payload.client);
  const paymentExpiresAt = buildPendingPaymentWindow(15);

  const appointment = await prisma.appointment.create({
    data: {
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

  const refreshedAppointment = await prisma.appointment.findUnique({
    where: { id: appointment.id },
    include: {
      client: true,
      service: true,
    },
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

async function listAppointments(filters) {
  await expirePendingReservations();

  const where = {};

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

async function getAppointmentById(id) {
  await expirePendingReservations();

  const appointment = await prisma.appointment.findUnique({
    where: { id: Number(id) },
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

async function updateAppointment(id, data) {
  const current = await prisma.appointment.findUnique({
    where: { id: Number(id) },
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
    appointmentData.date = data.date;
  }

  if (Object.prototype.hasOwnProperty.call(data, "startTime")) {
    appointmentData.startTime = data.startTime;
  }

  if (Object.prototype.hasOwnProperty.call(data, "endTime")) {
    appointmentData.endTime = data.endTime;
  }

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

  return serializeAppointment(appointment);
}

async function updateAppointmentStatus(id, status) {
  return updateAppointment(id, { status });
}

async function rescheduleAppointment(id, date, startTime) {
  const current = await prisma.appointment.findUnique({ where: { id: Number(id) } });

  if (!current) {
    throw new AppError("Turno no encontrado", 404);
  }

  const validation = await assertSlotAvailable({
    serviceId: current.serviceId,
    date,
    startTime,
    ignoredAppointmentId: id,
  });

  return updateAppointment(id, {
    date: new Date(validation.normalizedDate),
    startTime,
    endTime: validation.endTime,
  });
}

async function deleteAppointment(id) {
  const current = await prisma.appointment.findUnique({ where: { id: Number(id) } });
  if (!current) {
    throw new AppError("Turno no encontrado", 404);
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
