const { env } = require("../config/env");
const {
  runAppointmentRemindersJob,
  runPendingReservationsExpirationJob,
} = require("./tenant-jobs.service");
const { logJobAudit } = require("./jobs.audit");

function startJobLoop(name, intervalMs, job) {
  let isRunning = false;

  async function tick(trigger) {
    if (isRunning) {
      logJobAudit(`${name}.skipped`, { reason: "already_running", trigger });
      return;
    }

    isRunning = true;

    try {
      await job();
    } catch (error) {
      logJobAudit(`${name}.failed`, {
        trigger,
        message: error.message,
      });
    } finally {
      isRunning = false;
    }
  }

  void tick("startup");
  const timer = setInterval(() => {
    void tick("interval");
  }, intervalMs);

  return () => clearInterval(timer);
}

function startBackgroundJobs() {
  if (!env.jobsEnabled) {
    logJobAudit("runner.disabled", { reason: "jobs_disabled_by_env" });
    return () => {};
  }

  const stopExpirationLoop = startJobLoop(
    "pending_reservations_job",
    env.pendingReservationsJobIntervalMs,
    runPendingReservationsExpirationJob
  );
  const stopReminderLoop = startJobLoop(
    "appointment_reminders_job",
    env.appointmentReminderJobIntervalMs,
    runAppointmentRemindersJob
  );

  logJobAudit("runner.started", {
    pendingReservationsJobIntervalMs: env.pendingReservationsJobIntervalMs,
    appointmentReminderJobIntervalMs: env.appointmentReminderJobIntervalMs,
  });

  return () => {
    stopExpirationLoop();
    stopReminderLoop();
    logJobAudit("runner.stopped");
  };
}

module.exports = {
  startBackgroundJobs,
};
