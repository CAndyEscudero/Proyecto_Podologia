const { body, param, query } = require("express-validator");
const { isTimeRangeValid, isValidTime } = require("../../utils/validation");

const slotsQueryValidation = [
  query("serviceId").isInt(),
  query("date").isISO8601(),
];

const availabilityRuleValidation = [
  body("dayOfWeek").isInt({ min: 0, max: 6 }),
  body("type").isIn(["WORKING_HOURS", "BREAK"]),
  body("startTime").custom(isValidTime).withMessage("Hora de inicio invalida"),
  body("endTime")
    .custom((value, { req }) => isTimeRangeValid(req.body.startTime, value))
    .withMessage("El rango horario es invalido"),
];

const blockedDateValidation = [
  body("date").isISO8601(),
  body("startTime").optional().custom(isValidTime).withMessage("Hora de inicio invalida"),
  body("endTime")
    .optional()
    .custom((value, { req }) => {
      if (!req.body.startTime) {
        return false;
      }

      return isTimeRangeValid(req.body.startTime, value);
    })
    .withMessage("El rango horario bloqueado es invalido"),
  body("reason").optional({ nullable: true }).isLength({ min: 3, max: 180 }),
];

const idValidation = [param("id").isInt()];

module.exports = {
  availabilityRuleValidation,
  blockedDateValidation,
  idValidation,
  slotsQueryValidation,
};
