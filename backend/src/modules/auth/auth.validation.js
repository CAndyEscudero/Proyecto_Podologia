const { body } = require("express-validator");

const loginValidation = [
  body("email").trim().isLength({ min: 6, max: 120 }).isEmail().normalizeEmail().withMessage("Email invalido"),
  body("password").isString().isLength({ min: 8, max: 72 }).withMessage("Password invalido"),
];

module.exports = { loginValidation };
