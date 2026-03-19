const dayjs = require("dayjs");

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeString(minutes) {
  const safeMinutes = Math.max(minutes, 0);
  const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
  const mins = String(safeMinutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function addMinutes(time, amount) {
  return toTimeString(toMinutes(time) + amount);
}

function normalizeDate(value) {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return dayjs(value).format("YYYY-MM-DD");
}

function getCurrentTimeString(reference = dayjs()) {
  return dayjs(reference).format("HH:mm");
}

function isTodayDate(date, reference = dayjs()) {
  return normalizeDate(date) === normalizeDate(reference);
}

function isPastSlotForDate(date, startTime, reference = dayjs()) {
  if (!isTodayDate(date, reference)) {
    return false;
  }

  return toMinutes(startTime) <= toMinutes(getCurrentTimeString(reference));
}

function overlaps(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

module.exports = {
  addMinutes,
  getCurrentTimeString,
  isPastSlotForDate,
  isTodayDate,
  normalizeDate,
  overlaps,
  toMinutes,
  toTimeString,
};
