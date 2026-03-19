const { body, param } = require("express-validator");
const { isValidName, isValidPhone } = require("../../utils/validation");

const createClientValidation = [
  body("firstName").trim().custom(isValidName).withMessage("Nombre invalido"),
  body("lastName").trim().custom(isValidName).withMessage("Apellido invalido"),
  body("phone").trim().custom(isValidPhone).withMessage("Telefono invalido"),
  body("email").optional({ nullable: true }).trim().isEmail().normalizeEmail().withMessage("Email invalido"),
  body("notes").optional({ nullable: true }).isLength({ max: 1000 }).withMessage("Notas demasiado largas"),
];

const clientIdValidation = [param("id").isInt()];

module.exports = { createClientValidation, clientIdValidation };
