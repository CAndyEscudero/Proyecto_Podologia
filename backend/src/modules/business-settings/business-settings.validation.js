const { body } = require("express-validator");

const updateBusinessSettingsValidation = [
  body("businessName").optional().trim().isLength({ min: 3, max: 120 }),
  body("contactEmail").optional({ nullable: true }).custom((value) => value === null || value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  body("phone").optional({ nullable: true }).isLength({ min: 8, max: 20 }),
  body("address").optional({ nullable: true }).isLength({ min: 5, max: 180 }),
  body("appointmentGapMin").optional().isInt({ min: 0, max: 120 }),
  body("bookingWindowDays").optional().isInt({ min: 1, max: 365 }),
  body("depositPercentage").optional().isInt({ min: 1, max: 100 }),
  body("mercadoPagoEnabled").optional().isBoolean(),
  body("mercadoPagoPublicKey").optional({ nullable: true }).isLength({ min: 0, max: 255 }),
  body("mercadoPagoAccessToken").optional({ nullable: true }).isLength({ min: 0, max: 4096 }),
  body("mercadoPagoWebhookSecret").optional({ nullable: true }).isLength({ min: 0, max: 4096 }),
  body("transactionalEmailEnabled").optional().isBoolean(),
  body("transactionalEmailFromName").optional({ nullable: true }).isLength({ min: 0, max: 120 }),
  body("transactionalEmailReplyTo")
    .optional({ nullable: true })
    .custom((value) => value === null || value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  body("whatsAppEnabled").optional().isBoolean(),
  body("whatsAppNumber").optional({ nullable: true }).isLength({ min: 0, max: 30 }),
  body("whatsAppDefaultMessage").optional({ nullable: true }).isLength({ min: 0, max: 500 }),
  body("timezone").optional().isLength({ min: 3, max: 80 }),
];

module.exports = { updateBusinessSettingsValidation };
