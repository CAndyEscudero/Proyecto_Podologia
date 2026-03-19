const { body } = require("express-validator");

const updateBusinessSettingsValidation = [
  body("businessName").optional().trim().isLength({ min: 3, max: 120 }),
  body("contactEmail").optional({ nullable: true }).custom((value) => value === null || value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  body("phone").optional({ nullable: true }).isLength({ min: 8, max: 20 }),
  body("address").optional({ nullable: true }).isLength({ min: 5, max: 180 }),
  body("appointmentGapMin").optional().isInt({ min: 0, max: 120 }),
  body("bookingWindowDays").optional().isInt({ min: 1, max: 365 }),
  body("timezone").optional().isLength({ min: 3, max: 80 }),
];

module.exports = { updateBusinessSettingsValidation };
