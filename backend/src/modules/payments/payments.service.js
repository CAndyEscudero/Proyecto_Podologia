const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");
const { logPaymentAudit } = require("./payments.audit");
const { sendPaymentStatusEmails } = require("../notifications/email.service");
const { buildReminderStateForAppointment } = require("../notifications/reminder-schedule.service");
const {
  getFreshMercadoPagoConnection,
  markMercadoPagoWebhookReceived,
} = require("./mercadopago-oauth.service");

const LOCAL_HOSTNAME_PATTERN = /(^localhost$)|(^127(?:\.\d{1,3}){3}$)|(\.localhost$)/i;

function calculateDepositCents(priceCents, depositPercentage = 50) {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return null;
  }

  if (!Number.isInteger(depositPercentage) || depositPercentage <= 0 || depositPercentage > 100) {
    return null;
  }

  return Math.ceil(priceCents * (depositPercentage / 100));
}

function buildPendingPaymentWindow(minutes = 15) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

function normalizeTenantId(value) {
  const parsedId = Number(value);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

function isLocalHostname(hostname) {
  return typeof hostname === "string" && LOCAL_HOSTNAME_PATTERN.test(hostname.trim().toLowerCase());
}

function buildTenantAppBaseUrl(hostname) {
  const fallbackUrl = new URL(env.appBaseUrl);

  if (!hostname) {
    return fallbackUrl.toString();
  }

  const protocol =
    env.nodeEnv !== "production" || isLocalHostname(hostname) ? fallbackUrl.protocol : "https:";
  const shouldReusePort = env.nodeEnv !== "production" || isLocalHostname(hostname);
  const port = shouldReusePort && fallbackUrl.port ? `:${fallbackUrl.port}` : "";

  return `${protocol}//${hostname}${port}`;
}

async function getTenantMercadoPagoContext(tenantId) {
  const parsedTenantId = normalizeTenantId(tenantId);

  if (!parsedTenantId) {
    throw new AppError("No se pudo resolver el tenant del pago", 400);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsedTenantId },
    include: {
      businessSettings: true,
      domains: {
        where: { status: "ACTIVE" },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!tenant) {
    throw new AppError("Tenant no encontrado para operar pagos", 404);
  }

  if (tenant.status !== "ACTIVE") {
    throw new AppError("El tenant no esta activo para operar pagos", 403);
  }

  const primaryDomain = tenant.domains[0] || null;
  const connection = await getFreshMercadoPagoConnection(tenant.id);

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    settings: tenant.businessSettings,
    connection,
    primaryDomain,
    appBaseUrl: buildTenantAppBaseUrl(primaryDomain?.hostname || null),
  };
}

function resolveTenantMercadoPagoAccessToken(tenantContext) {
  if (tenantContext.connection?.status === "CONNECTED" && tenantContext.connection.accessToken) {
    return tenantContext.connection.accessToken;
  }

  return tenantContext.settings?.mercadoPagoAccessToken || "";
}

function ensureMercadoPagoConfigured(tenantContext) {
  if (!tenantContext.settings?.mercadoPagoEnabled) {
    throw new AppError("Mercado Pago no esta habilitado para este negocio", 503);
  }

  if (!resolveTenantMercadoPagoAccessToken(tenantContext)) {
    throw new AppError(
      "Mercado Pago no esta configurado para este negocio. Conecta la cuenta del tenant.",
      503
    );
  }
}

function buildTenantNotificationUrl(tenantId) {
  const url = new URL("/api/payments/webhook", env.apiBaseUrl);
  url.searchParams.set("tenantId", String(tenantId));
  return url.toString();
}

function buildTenantBackUrls(tenantId) {
  const buildReturnUrl = (status) => {
    const url = new URL(`/api/payments/return/${status}`, env.apiBaseUrl);
    url.searchParams.set("tenantId", String(tenantId));
    return url.toString();
  };

  return {
    success: buildReturnUrl("success"),
    pending: buildReturnUrl("pending"),
    failure: buildReturnUrl("failure"),
  };
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

function hasPaymentWindowExpired(paymentExpiresAt) {
  if (!paymentExpiresAt) {
    return false;
  }

  return new Date(paymentExpiresAt).getTime() < Date.now();
}

async function createMercadoPagoPreference({ appointment, client, service }) {
  const tenantContext = await getTenantMercadoPagoContext(appointment.tenantId);
  ensureMercadoPagoConfigured(tenantContext);

  if (!appointment.depositCents || appointment.depositCents <= 0) {
    throw new AppError("La reserva no tiene una sena valida para cobrar", 409);
  }

  const externalReference = buildExternalReference(appointment.id);
  const webhookUrl = buildTenantNotificationUrl(tenantContext.tenantId);
  const backUrls = buildTenantBackUrls(tenantContext.tenantId);

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolveTenantMercadoPagoAccessToken(tenantContext)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: String(service.id),
          title: `${service.name}`,
          description: "Reserva confirmada con sena del servicio",
          currency_id: "ARS",
          quantity: 1,
          unit_price: appointment.depositCents,
        },
      ],
      payer: {
        name: client.firstName,
        surname: client.lastName,
        email: client.email || undefined,
      },
      back_urls: backUrls,
      notification_url: webhookUrl,
      auto_return: "approved",
      external_reference: externalReference,
      metadata: {
        appointmentId: appointment.id,
        serviceId: service.id,
        tenantId: tenantContext.tenantId,
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

  logPaymentAudit("preference.created", {
    tenantId: tenantContext.tenantId,
    appointmentId: appointment.id,
    serviceId: service.id,
    preferenceId: data.id,
    paymentOption: appointment.paymentOption,
    amount: appointment.depositCents,
  });

  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point || data.sandbox_init_point || null,
    externalReference,
  };
}

async function getMercadoPagoPayment(paymentId, tenantContext) {
  ensureMercadoPagoConfigured(tenantContext);

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${resolveTenantMercadoPagoAccessToken(tenantContext)}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError("No se pudo consultar el pago en Mercado Pago", 502, errorBody);
  }

  return response.json();
}

async function processMercadoPagoWebhook(payload, tenantId) {
  const paymentId = payload?.data?.id || payload?.id;
  const topic = payload?.type || payload?.topic;
  const tenantContext = await getTenantMercadoPagoContext(tenantId);

  if (!paymentId || (topic && topic !== "payment")) {
    logPaymentAudit("webhook.ignored", {
      tenantId: tenantContext.tenantId,
      reason: "unsupported_payload",
      paymentId: paymentId || null,
      topic: topic || null,
    });
    return { ignored: true };
  }

  const payment = await getMercadoPagoPayment(paymentId, tenantContext);
  const appointmentId = extractAppointmentId(payment.external_reference);

  if (!appointmentId) {
    logPaymentAudit("webhook.ignored", {
      tenantId: tenantContext.tenantId,
      reason: "missing_appointment_reference",
      paymentId: String(payment.id),
      externalReference: payment.external_reference || null,
      status: payment.status,
    });
    return { ignored: true };
  }

  const currentAppointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenantContext.tenantId,
    },
  });

  if (!currentAppointment) {
    logPaymentAudit("webhook.ignored", {
      tenantId: tenantContext.tenantId,
      reason: "appointment_not_found",
      paymentId: String(payment.id),
      appointmentId,
      status: payment.status,
    });
    return { ignored: true };
  }

  const statusMapping = mapMercadoPagoStatus(payment.status);
  const isDuplicateNotification =
    currentAppointment.paymentReference === String(payment.id) &&
    currentAppointment.paymentStatus === statusMapping.paymentStatus &&
    currentAppointment.status === statusMapping.appointmentStatus;

  if (isDuplicateNotification) {
    logPaymentAudit("webhook.duplicate", {
      tenantId: tenantContext.tenantId,
      appointmentId,
      paymentId: String(payment.id),
      status: payment.status,
    });

    return {
      ignored: false,
      duplicate: true,
      appointmentId,
      paymentId: String(payment.id),
      status: payment.status,
    };
  }

  const isLateApprovedPayment =
    payment.status === "approved" &&
    (currentAppointment.paymentStatus === "EXPIRED" ||
      hasPaymentWindowExpired(currentAppointment.paymentExpiresAt));

  if (isLateApprovedPayment) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELED",
        paymentStatus: "APPROVED",
        paymentReference: String(payment.id),
        paymentApprovedAt: new Date(payment.date_approved || new Date()),
        ...buildReminderStateForAppointment({
          date: currentAppointment.date,
          startTime: currentAppointment.startTime,
          status: "CANCELED",
        }),
      },
    });

    logPaymentAudit("webhook.manual_review", {
      tenantId: tenantContext.tenantId,
      appointmentId,
      paymentId: String(payment.id),
      status: payment.status,
      reason: "late_approved_payment",
    });

    return {
      ignored: false,
      appointmentId,
      paymentId: String(payment.id),
      status: payment.status,
      manualReview: true,
    };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentStatus: statusMapping.paymentStatus,
      status: statusMapping.appointmentStatus,
      paymentReference: String(payment.id),
      paymentApprovedAt:
        statusMapping.paymentStatus === "APPROVED" ? new Date(payment.date_approved || new Date()) : null,
      ...buildReminderStateForAppointment({
        date: currentAppointment.date,
        startTime: currentAppointment.startTime,
        status: statusMapping.appointmentStatus,
      }),
    },
  });

  logPaymentAudit("webhook.processed", {
    tenantId: tenantContext.tenantId,
    appointmentId,
    paymentId: String(payment.id),
    paymentStatus: statusMapping.paymentStatus,
    appointmentStatus: statusMapping.appointmentStatus,
  });

  await sendPaymentStatusEmails({
    tenantId: tenantContext.tenantId,
    appointmentId,
    paymentStatus: statusMapping.paymentStatus,
  });
  await markMercadoPagoWebhookReceived(tenantContext.tenantId, statusMapping.paymentStatus);

  return {
    ignored: false,
    appointmentId,
    paymentId: String(payment.id),
    status: payment.status,
  };
}

async function getMercadoPagoWebhookSecret(tenantId) {
  const tenantContext = await getTenantMercadoPagoContext(tenantId);

  if (tenantContext.connection?.status === "CONNECTED") {
    return env.mercadoPagoPlatformWebhookSecret || "";
  }

  return tenantContext.settings?.mercadoPagoWebhookSecret || "";
}

async function buildTenantFrontendReturnUrl(tenantId, status, query = {}) {
  const tenantContext = await getTenantMercadoPagoContext(tenantId);
  const frontendUrl = new URL("/reservas/resultado", tenantContext.appBaseUrl);
  frontendUrl.searchParams.set("status", status);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      frontendUrl.searchParams.set(key, String(value));
    }
  }

  return frontendUrl.toString();
}

async function expirePendingReservations(tenantId = null) {
  const result = await prisma.appointment.updateMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "CANCELED",
      paymentStatus: "EXPIRED",
    },
  });

  if (result.count > 0) {
    logPaymentAudit("reservations.expired", {
      tenantId: tenantId || null,
      count: result.count,
    });
  }

  return result.count;
}

module.exports = {
  buildPendingPaymentWindow,
  buildTenantFrontendReturnUrl,
  calculateDepositCents,
  createMercadoPagoPreference,
  expirePendingReservations,
  getMercadoPagoWebhookSecret,
  processMercadoPagoWebhook,
};
