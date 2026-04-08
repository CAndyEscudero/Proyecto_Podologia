const { body } = require("express-validator");

const frontendErrorValidation = [
  body("message").trim().isLength({ min: 1, max: 1000 }),
  body("severity").optional().isIn(["info", "warn", "error"]),
  body("source").optional({ nullable: true }).isLength({ min: 0, max: 120 }),
  body("pathname").optional({ nullable: true }).isLength({ min: 0, max: 255 }),
  body("href").optional({ nullable: true }).isLength({ min: 0, max: 500 }),
  body("stack").optional({ nullable: true }).isLength({ min: 0, max: 5000 }),
  body("userAgent").optional({ nullable: true }).isLength({ min: 0, max: 500 }),
];

module.exports = {
  frontendErrorValidation,
};
