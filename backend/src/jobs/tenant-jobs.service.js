const { prisma } = require("../config/prisma");
const { env } = require("../config/env");
const { expirePendingReservations } = require("../modules/payments/payments.service");
const {
  isEmailProviderConfigured,
  sendAppointmentReminderEmail,
} = require("../modules/notifications/email.service");
const { buildAppointmentStartDate } = require("../modules/notifications/reminder-schedule.service");
const { logJobAudit } = require("./jobs.audit");

async function listActiveTenants() {
  return prisma.tenant.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
    orderBy: { id: "asc" },
  });
}

async function runPendingReservationsExpirationJob() {
  const tenants = await listActiveTenants();
  let expiredCount = 0;

  for (const tenant of tenants) {
    const count = await expirePendingReservations(tenant.id);
    expiredCount += count;
  }

  logJobAudit("pending_reservations.expired", {
    tenantsProcessed: tenants.length,
    expiredCount,
  });

  return {
    tenantsProcessed: tenants.length,
    expiredCount,
  };
}

async function markReminderAttempt(appointmentId, data) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data,
  });
}

async function processTenantAppointmentReminders(tenantId) {
  if (!isEmailProviderConfigured()) {
    logJobAudit("appointment_reminders.skipped", {
      tenantId,
      reason: "email_provider_not_configured",
    });
    return {
      tenantId,
      queued: 0,
      sent: 0,
      failed: 0,
      closedWithoutSend: 0,
    };
  }

  const now = new Date();
  const retryCutoff = new Date(
    now.getTime() - env.appointmentReminderRetryDelayMinutes * 60 * 1000
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: "CONFIRMED",
      reminderDueAt: {
        not: null,
        lte: now,
      },
      reminderProcessedAt: null,
      reminderSendAttempts: {
        lt: env.appointmentReminderMaxAttempts,
      },
      OR: [
        { reminderLastAttemptAt: null },
        { reminderLastAttemptAt: { lte: retryCutoff } },
      ],
      client: {
        is: {
          email: {
            not: null,
          },
        },
      },
      tenant: {
        is: {
          businessSettings: {
            is: {
              transactionalEmailEnabled: true,
            },
          },
        },
      },
    },
    select: {
      id: true,
      tenantId: true,
      date: true,
      startTime: true,
      reminderSendAttempts: true,
    },
    orderBy: [{ reminderDueAt: "asc" }, { id: "asc" }],
  });

  let sent = 0;
  let failed = 0;
  let closedWithoutSend = 0;

  for (const appointment of appointments) {
    const appointmentStart = buildAppointmentStartDate(
      appointment.date,
      appointment.startTime
    );

    if (appointmentStart.getTime() <= now.getTime()) {
      closedWithoutSend += 1;
      await markReminderAttempt(appointment.id, {
        reminderProcessedAt: now,
        reminderLastAttemptAt: now,
        reminderSendAttempts: {
          increment: 1,
        },
        reminderLastError: "appointment_already_started",
      });
      continue;
    }

    const result = await sendAppointmentReminderEmail({
      tenantId,
      appointmentId: appointment.id,
    });

    if (result?.failed) {
      failed += 1;
      await markReminderAttempt(appointment.id, {
        reminderLastAttemptAt: now,
        reminderSendAttempts: {
          increment: 1,
        },
        reminderLastError: "send_failed",
      });
      continue;
    }

    if (result?.skipped) {
      closedWithoutSend += 1;
      await markReminderAttempt(appointment.id, {
        reminderProcessedAt: now,
        reminderLastAttemptAt: now,
        reminderSendAttempts: {
          increment: 1,
        },
        reminderLastError: result.reason || "send_skipped",
      });
      continue;
    }

    sent += 1;
    await markReminderAttempt(appointment.id, {
      reminderSentAt: now,
      reminderProcessedAt: now,
      reminderLastAttemptAt: now,
      reminderSendAttempts: {
        increment: 1,
      },
      reminderLastError: null,
    });
  }

  return {
    tenantId,
    queued: appointments.length,
    sent,
    failed,
    closedWithoutSend,
  };
}

async function runAppointmentRemindersJob() {
  const tenants = await listActiveTenants();
  const results = [];

  for (const tenant of tenants) {
    const result = await processTenantAppointmentReminders(tenant.id);
    results.push(result);
  }

  const summary = results.reduce(
    (accumulator, item) => {
      accumulator.queued += item.queued;
      accumulator.sent += item.sent;
      accumulator.failed += item.failed;
      accumulator.closedWithoutSend += item.closedWithoutSend;
      return accumulator;
    },
    {
      tenantsProcessed: tenants.length,
      queued: 0,
      sent: 0,
      failed: 0,
      closedWithoutSend: 0,
    }
  );

  logJobAudit("appointment_reminders.processed", summary);

  return summary;
}

module.exports = {
  runAppointmentRemindersJob,
  runPendingReservationsExpirationJob,
};
