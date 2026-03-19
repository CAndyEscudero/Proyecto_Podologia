const { Router } = require("express");
const {
  listServicesController,
  createServiceController,
  updateServiceController,
  deleteServiceController,
} = require("./services.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const { serviceCreateValidation, serviceIdValidation, serviceUpdateValidation } = require("./services.validation");

const router = Router();

router.get("/", asyncHandler(listServicesController));
router.post("/", requireAuth, requireRoles("OWNER", "ADMIN"), serviceCreateValidation, validateRequest, asyncHandler(createServiceController));
router.patch("/:id", requireAuth, requireRoles("OWNER", "ADMIN"), serviceIdValidation, serviceUpdateValidation, validateRequest, asyncHandler(updateServiceController));
router.delete("/:id", requireAuth, requireRoles("OWNER", "ADMIN"), serviceIdValidation, validateRequest, asyncHandler(deleteServiceController));

module.exports = router;
