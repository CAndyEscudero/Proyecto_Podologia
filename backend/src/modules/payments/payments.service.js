const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");

function calculateDepositCents(priceCents) {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return null;
  }

  return Math.ceil(priceCents * 0.5);
}

function buildPendingPaymentWindow(minutes = 15) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

function ensureMercadoPagoConfigured() {
  if (!env.mercadoPagoAccessToken) {
    throw new AppError(
      "Mercado Pago no esta configurado. Carga MP_ACCESS_TOKEN para habilitar pagos.",
      503
    );
  }
}

function buildExternalReference(appointmentId) {
  return `appointment:${appointmentId}`;
}

function extractAppointmentId(reference) {
  if (!reference || typeof reference !== "string") {
    return null;
  }

  const [resource, id] = reference.split(":");
  if (resource !== "appointment" || !id) {
    return null;
  }

  const parsedId = Number(id);
  return Number.isInteger(parsedId) ? parsedId : null;
}

function mapMercadoPagoStatus(status) {
  switch (status) {
    case "approved":
      return {
        paymentStatus: "APPROVED",
        appointmentStatus: "CONFIRMED",
      };
    case "rejected":
      return {
        paymentStatus: "REJECTED",
        appointmentStatus: "CANCELED",
      };
    case "cancelled":
      return {
        paymentStatus: "CANCELLED",
        appointmentStatus: "CANCELED",
      };
    case "in_process":
    case "pending":
      return {
        paymentStatus: "PENDING",
        appointmentStatus: "PENDING",
      };
    default:
      return {
        paymentStatus: "PENDING",
        appointmentStatus: "PENDING",
      };
  }
}

async function createMercadoPagoPreference({ appointment, client, service }) {
  ensureMercadoPagoConfigured();

  if (!appointment.depositCents || appointment.depositCents <= 0) {
    throw new AppError("La reserva no tiene una seña valida para cobrar", 409);
  }

  const externalReference = buildExternalReference(appointment.id);
  const webhookUrl = `${env.apiBaseUrl}/api/payments/webhook`;
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: String(service.id),
          title: `${service.name} - Reserva con seña`,
          description: `Seña del 50% para ${service.name}`,
          currency_id: "ARS",
          quantity: 1,
          unit_price: appointment.depositCents / 100,
        },
      ],
      payer: {
        name: client.firstName,
        surname: client.lastName,
        email: client.email || undefined,
      },
      back_urls: {
        success: env.mercadoPagoSuccessUrl,
        pending: env.mercadoPagoPendingUrl,
        failure: env.mercadoPagoFailureUrl,
      },
      notification_url: webhookUrl,
      auto_return: "approved",
      external_reference: externalReference,
      metadata: {
        appointmentId: appointment.id,
        serviceId: service.id,
        paymentOption: appointment.paymentOption,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError("No se pudo crear la preferencia de Mercado Pago", 502, errorBody);
  }

  const data = await response.json();

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      paymentPreferenceId: data.id,
    },
  });

  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point || data.sandbox_init_point || null,
    externalReference,
  };
}

async function getMercadoPagoPayment(paymentId) {
  ensureMercadoPagoConfigured();

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError("No se pudo consultar el pago en Mercado Pago", 502, errorBody);
  }

  return response.json();
}

async function processMercadoPagoWebhook(payload) {
  const paymentId = payload?.data?.id || payload?.id;
  const topic = payload?.type || payload?.topic;

  if (!paymentId || (topic && topic !== "payment")) {
    return { ignored: true };
  }

  const payment = await getMercadoPagoPayment(paymentId);
  const appointmentId = extractAppointmentId(payment.external_reference);

  if (!appointmentId) {
    return { ignored: true };
  }

  const statusMapping = mapMercadoPagoStatus(payment.status);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentStatus: statusMapping.paymentStatus,
      status: statusMapping.appointmentStatus,
      paymentReference: String(payment.id),
      paymentApprovedAt:
        statusMapping.paymentStatus === "APPROVED" ? new Date(payment.date_approved || new Date()) : null,
    },
  });

  return {
    ignored: false,
    appointmentId,
    paymentId: String(payment.id),
    status: payment.status,
  };
}

module.exports = {
  buildPendingPaymentWindow,
  calculateDepositCents,
  createMercadoPagoPreference,
  processMercadoPagoWebhook,
};
