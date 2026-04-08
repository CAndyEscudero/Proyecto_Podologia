const { body, param } = require("express-validator");

const upsertTenantCustomDomainValidation = [
  body("hostname")
    .trim()
    .isLength({ min: 4, max: 255 })
    .withMessage("Ingresa un dominio valido"),
];

const tenantDomainIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Id de dominio invalido"),
];

module.exports = {
  tenantDomainIdValidation,
  upsertTenantCustomDomainValidation,
};
