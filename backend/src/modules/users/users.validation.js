const { body } = require("express-validator");
const { isValidName } = require("../../utils/validation");

const createUserValidation = [
  body("fullName").trim().custom(isValidName).withMessage("Nombre invalido"),
  body("email").trim().isLength({ min: 6, max: 120 }).isEmail().normalizeEmail().withMessage("Email invalido"),
  body("password")
    .isLength({ min: 8, max: 72 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .withMessage("La password debe incluir letras, numeros y simbolos"),
  body("role").optional().isIn(["OWNER", "ADMIN", "STAFF"]),
];

module.exports = { createUserValidation };
