const { normalizeDate } = require("../../utils/time");
const { env } = require("../../config/env");

function buildAppointmentStartDate(date, startTime) {
  const normalizedDate = normalizeDate(date);
  const [hours, minutes] = String(startTime || "00:00")
    .split(":")
    .map((item) => Number(item || 0));

  const appointmentDate = new Date(`${normalizedDate}T00:00:00`);
  appointmentDate.setHours(hours || 0, minutes || 0, 0, 0);
  return appointmentDate;
}

function calculateReminderDueAt(date, startTime, leadMinutes = env.appointmentReminderLeadMinutes) {
  if (!date || !startTime || !Number.isFinite(leadMinutes) || leadMinutes <= 0) {
    return null;
  }

  const appointmentStart = buildAppointmentStartDate(date, startTime);
  appointmentStart.setMinutes(appointmentStart.getMinutes() - leadMinutes);
  return appointmentStart;
}

function buildReminderStateForAppointment({
  date,
  startTime,
  status,
  leadMinutes = env.appointmentReminderLeadMinutes,
}) {
  if (status !== "CONFIRMED") {
    return {
      reminderDueAt: null,
      reminderSentAt: null,
      reminderProcessedAt: null,
      reminderLastAttemptAt: null,
      reminderSendAttempts: 0,
      reminderLastError: null,
    };
  }

  return {
    reminderDueAt: calculateReminderDueAt(date, startTime, leadMinutes),
    reminderSentAt: null,
    reminderProcessedAt: null,
    reminderLastAttemptAt: null,
    reminderSendAttempts: 0,
    reminderLastError: null,
  };
}

module.exports = {
  buildAppointmentStartDate,
  buildReminderStateForAppointment,
  calculateReminderDueAt,
};
