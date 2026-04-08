const { Router } = require("express");
const { asyncHandler } = require("../../utils/async-handler");
const { validateRequest } = require("../../middleware/validate-request");
const { reportFrontendErrorController } = require("./observability.controller");
const { frontendErrorValidation } = require("./observability.validation");

const router = Router();

router.post(
  "/frontend-errors",
  frontendErrorValidation,
  validateRequest,
  asyncHandler(reportFrontendErrorController)
);

module.exports = router;
