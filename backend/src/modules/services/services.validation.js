const { body, param } = require("express-validator");
const { isValidSlug } = require("../../utils/validation");

const serviceCreateValidation = [
  body("name").trim().isLength({ min: 3, max: 80 }),
  body("slug").trim().custom(isValidSlug).withMessage("Slug invalido"),
  body("description").trim().isLength({ min: 10, max: 800 }),
  body("durationMin").isInt({ min: 15 }),
  body("priceCents").optional().isInt({ min: 0, max: 100000000 }),
];

const serviceIdValidation = [param("id").isInt()];

const serviceUpdateValidation = [
  body("name").optional().trim().isLength({ min: 3, max: 80 }),
  body("slug").optional().trim().custom(isValidSlug).withMessage("Slug invalido"),
  body("description").optional().trim().isLength({ min: 10, max: 800 }),
  body("durationMin").optional().isInt({ min: 15 }),
  body("priceCents").optional().isInt({ min: 0, max: 100000000 }),
];

module.exports = { serviceCreateValidation, serviceIdValidation, serviceUpdateValidation };
