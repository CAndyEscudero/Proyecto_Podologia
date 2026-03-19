const { body, param } = require("express-validator");
const { isTimeRangeValid, isValidName, isValidPhone, isValidTime } = require("../../utils/validation");

const appointmentCreateValidation = [
  body("serviceId").isInt(),
  body("date").isISO8601(),
  body("startTime").custom(isValidTime).withMessage("Horario invalido"),
  body("client.firstName").trim().custom(isValidName).withMessage("Nombre invalido"),
  body("client.lastName").trim().custom(isValidName).withMessage("Apellido invalido"),
  body("client.phone").trim().custom(isValidPhone).withMessage("Telefono invalido"),
  body("client.email").optional({ nullable: true }).trim().isEmail().normalizeEmail().withMessage("Email invalido"),
  body("client.notes").optional({ nullable: true }).isLength({ max: 1000 }).withMessage("Notas demasiado largas"),
];

const appointmentUpdateValidation = [
  param("id").isInt(),
  body("status").optional().isIn(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"]),
  body("notes").optional({ nullable: true }).isString(),
  body("client.firstName").optional().trim().custom(isValidName).withMessage("Nombre invalido"),
  body("client.lastName").optional().trim().custom(isValidName).withMessage("Apellido invalido"),
  body("client.phone").optional().trim().custom(isValidPhone).withMessage("Telefono invalido"),
  body("client.email").optional({ nullable: true }).custom((value) => value === null || value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  body("client.notes").optional({ nullable: true }).isLength({ max: 1000 }),
];

const appointmentStatusValidation = [
  param("id").isInt(),
  body("status").isIn(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"]),
];

const appointmentRescheduleValidation = [
  param("id").isInt(),
  body("date").isISO8601(),
  body("startTime").custom(isValidTime).withMessage("Horario invalido"),
];

module.exports = {
  appointmentCreateValidation,
  appointmentRescheduleValidation,
  appointmentStatusValidation,
  appointmentUpdateValidation,
};
