const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]{2,80}$/;
const PHONE_REGEX = /^[0-9+() -]{8,20}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const SLUG_REGEX = /^[a-z0-9-]{3,80}$/;

function isValidName(value) {
  return NAME_REGEX.test(String(value || ""));
}

function isValidPhone(value) {
  return PHONE_REGEX.test(String(value || ""));
}

function isValidTime(value) {
  return TIME_REGEX.test(String(value || ""));
}

function isValidSlug(value) {
  return SLUG_REGEX.test(String(value || ""));
}

function isTimeRangeValid(startTime, endTime) {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return false;
  }

  return startTime < endTime;
}

module.exports = {
  isTimeRangeValid,
  isValidName,
  isValidPhone,
  isValidSlug,
  isValidTime,
};
