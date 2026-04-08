const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { logEmailAudit } = require("./email.audit");
const {
  buildAppointmentReminderPatientEmail,
  buildApprovedPaymentPatientEmail,
  buildBusinessApprovedReservationEmail,
  buildCanceledAppointmentPatientEmail,
  buildPendingPaymentPatientEmail,
  buildRejectedPaymentPatientEmail,
  buildRescheduledAppointmentPatientEmail,
} = require("./email.templates");

const LOCAL_HOSTNAME_PATTERN = /(^localhost$)|(^127(?:\.\d{1,3}){3}$)|(\.localhost$)/i;

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

function isEmailProviderConfigured() {
  return env.emailProvider === "resend" && Boolean(env.resendApiKey) && Boolean(env.platformEmailFrom);
}

function normalizeEmail(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

async function getNotificationContext(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      businessSettings: true,
      domains: {
        where: { status: "ACTIVE" },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!tenant || !tenant.businessSettings) {
    return null;
  }

  const primaryDomain = tenant.domains[0] || null;
  const appBaseUrl = buildTenantAppBaseUrl(primaryDomain?.hostname || null);

  return {
    tenantId: tenant.id,
    tenantName: tenant.businessSettings.businessName || tenant.name,
    bookingUrl: new URL("/reservas", appBaseUrl).toString(),
    contactEmail: tenant.businessSettings.contactEmail || null,
    phone: tenant.businessSettings.phone || null,
    address: tenant.businessSettings.address || null,
    replyTo:
      tenant.businessSettings.transactionalEmailReplyTo ||
      tenant.businessSettings.contactEmail ||
      null,
    fromName:
      tenant.businessSettings.transactionalEmailFromName ||
      tenant.businessSettings.businessName ||
      tenant.name,
    emailsEnabled: Boolean(tenant.businessSettings.transactionalEmailEnabled),
  };
}

async function sendResendEmail({
  tenantId,
  event,
  to,
  subject,
  html,
  text,
  replyTo,
  fromName,
  idempotencyKey,
}) {
  if (!isEmailProviderConfigured()) {
    logEmailAudit("send.skipped", {
      tenantId,
      event,
      reason: "provider_not_configured",
      to,
    });
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: `${fromName} <${env.platformEmailFrom}>`,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logEmailAudit("send.failed", {
      tenantId,
      event,
      to,
      statusCode: response.status,
      errorBody,
    });
    return { skipped: false, failed: true };
  }

  const data = await response.json();
  logEmailAudit("send.succeeded", {
    tenantId,
    event,
    to,
    provider: "resend",
    emailId: data?.id || null,
  });

  return { skipped: false, failed: false, id: data?.id || null };
}

async function safeSendEmail(message) {
  try {
    return await sendResendEmail(message);
  } catch (error) {
    logEmailAudit("send.exception", {
      tenantId: message.tenantId,
      event: message.event,
      to: message.to,
      message: error.message,
    });
    return { failed: true };
  }
}

async function getAppointmentNotificationPayload(tenantId, appointmentId) {
  const [context, appointment] = await Promise.all([
    getNotificationContext(tenantId),
    prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId,
      },
      include: {
        client: true,
        service: true,
      },
    }),
  ]);

  if (!context || !appointment) {
    return null;
  }

  return {
    ...context,
    appointment,
    client: appointment.client,
    service: appointment.service,
  };
}

async function sendPendingPaymentReservationEmail({ tenantId, appointmentId, checkoutUrl }) {
  const payload = await getAppointmentNotificationPayload(tenantId, appointmentId);

  if (!payload || !payload.emailsEnabled) {
    return { skipped: true };
  }

  const recipient = normalizeEmail(payload.client.email);

  if (!recipient) {
    logEmailAudit("send.skipped", {
      tenantId,
      event: "reservation.pending_payment.patient",
      reason: "missing_patient_email",
      appointmentId,
    });
    return { skipped: true };
  }

  const template = buildPendingPaymentPatientEmail({
    ...payload,
    checkoutUrl,
  });

  return safeSendEmail({
    tenantId,
    event: "reservation.pending_payment.patient",
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: payload.replyTo,
    fromName: payload.fromName,
    idempotencyKey: `reservation-pending-${appointmentId}`,
  });
}

async function sendPaymentStatusEmails({ tenantId, appointmentId, paymentStatus }) {
  const payload = await getAppointmentNotificationPayload(tenantId, appointmentId);

  if (!payload || !payload.emailsEnabled) {
    return { skipped: true };
  }

  const tasks = [];
  const patientEmail = normalizeEmail(payload.client.email);
  const businessEmail = normalizeEmail(payload.contactEmail);

  if (paymentStatus === "APPROVED") {
    if (patientEmail) {
      const patientTemplate = buildApprovedPaymentPatientEmail(payload);
      tasks.push(
        safeSendEmail({
          tenantId,
          event: "payment.approved.patient",
          to: patientEmail,
          subject: patientTemplate.subject,
          html: patientTemplate.html,
          text: patientTemplate.text,
          replyTo: payload.replyTo,
          fromName: payload.fromName,
          idempotencyKey: `payment-approved-patient-${appointmentId}-${payload.appointment.paymentReference || "none"}`,
        })
      );
    }

    if (businessEmail) {
      const businessTemplate = buildBusinessApprovedReservationEmail(payload);
      tasks.push(
        safeSendEmail({
          tenantId,
          event: "payment.approved.business",
          to: businessEmail,
          subject: businessTemplate.subject,
          html: businessTemplate.html,
          text: businessTemplate.text,
          replyTo: payload.replyTo,
          fromName: payload.fromName,
          idempotencyKey: `payment-approved-business-${appointmentId}-${payload.appointment.paymentReference || "none"}`,
        })
      );
    }
  }

  if (paymentStatus === "REJECTED" || paymentStatus === "CANCELLED") {
    if (patientEmail) {
      const rejectedTemplate = buildRejectedPaymentPatientEmail(payload);
      tasks.push(
        safeSendEmail({
          tenantId,
          event: "payment.rejected.patient",
          to: patientEmail,
          subject: rejectedTemplate.subject,
          html: rejectedTemplate.html,
          text: rejectedTemplate.text,
          replyTo: payload.replyTo,
          fromName: payload.fromName,
          idempotencyKey: `payment-rejected-patient-${appointmentId}-${payload.appointment.paymentReference || "none"}`,
        })
      );
    }
  }

  if (!tasks.length) {
    logEmailAudit("send.skipped", {
      tenantId,
      event: "payment.status.notifications",
      reason: "no_recipients_or_unsupported_status",
      appointmentId,
      paymentStatus,
    });
    return { skipped: true };
  }

  await Promise.all(tasks);
  return { skipped: false };
}

async function sendAppointmentReminderEmail({ tenantId, appointmentId }) {
  const payload = await getAppointmentNotificationPayload(tenantId, appointmentId);

  if (!payload || !payload.emailsEnabled) {
    return { skipped: true, reason: "emails_disabled" };
  }

  const recipient = normalizeEmail(payload.client.email);

  if (!recipient) {
    logEmailAudit("send.skipped", {
      tenantId,
      event: "appointment.reminder.patient",
      reason: "missing_patient_email",
      appointmentId,
    });
    return { skipped: true, reason: "missing_patient_email" };
  }

  const template = buildAppointmentReminderPatientEmail(payload);

  return safeSendEmail({
    tenantId,
    event: "appointment.reminder.patient",
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: payload.replyTo,
    fromName: payload.fromName,
    idempotencyKey: `appointment-reminder-${appointmentId}-${payload.appointment.startTime}-${payload.appointment.date}`,
  });
}

async function sendRescheduledAppointmentEmail({
  tenantId,
  appointmentId,
  previousSchedule,
}) {
  const payload = await getAppointmentNotificationPayload(tenantId, appointmentId);

  if (!payload || !payload.emailsEnabled) {
    return { skipped: true, reason: "emails_disabled" };
  }

  const recipient = normalizeEmail(payload.client.email);

  if (!recipient) {
    logEmailAudit("send.skipped", {
      tenantId,
      event: "appointment.rescheduled.patient",
      reason: "missing_patient_email",
      appointmentId,
    });
    return { skipped: true, reason: "missing_patient_email" };
  }

  const template = buildRescheduledAppointmentPatientEmail({
    ...payload,
    previousSchedule,
  });

  return safeSendEmail({
    tenantId,
    event: "appointment.rescheduled.patient",
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: payload.replyTo,
    fromName: payload.fromName,
    idempotencyKey: `appointment-rescheduled-${appointmentId}-${payload.appointment.date}-${payload.appointment.startTime}`,
  });
}

async function sendCanceledAppointmentEmail({ tenantId, appointmentId }) {
  const payload = await getAppointmentNotificationPayload(tenantId, appointmentId);

  if (!payload || !payload.emailsEnabled) {
    return { skipped: true, reason: "emails_disabled" };
  }

  const recipient = normalizeEmail(payload.client.email);

  if (!recipient) {
    logEmailAudit("send.skipped", {
      tenantId,
      event: "appointment.canceled.patient",
      reason: "missing_patient_email",
      appointmentId,
    });
    return { skipped: true, reason: "missing_patient_email" };
  }

  const template = buildCanceledAppointmentPatientEmail(payload);

  return safeSendEmail({
    tenantId,
    event: "appointment.canceled.patient",
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: payload.replyTo,
    fromName: payload.fromName,
    idempotencyKey: `appointment-canceled-${appointmentId}-${payload.appointment.updatedAt || "none"}`,
  });
}

module.exports = {
  isEmailProviderConfigured,
  sendAppointmentReminderEmail,
  sendCanceledAppointmentEmail,
  sendPaymentStatusEmails,
  sendPendingPaymentReservationEmail,
  sendRescheduledAppointmentEmail,
};
