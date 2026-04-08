const { Router } = require("express");
const {
  getBusinessSettingsController,
  getPublicBusinessSettingsController,
  updateBusinessSettingsController,
} = require("./business-settings.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const { updateBusinessSettingsValidation } = require("./business-settings.validation");

const router = Router();

router.get("/public", asyncHandler(getPublicBusinessSettingsController));
router.get("/", requireAuth, requireRoles("OWNER", "ADMIN"), asyncHandler(getBusinessSettingsController));
router.patch("/", requireAuth, requireRoles("OWNER", "ADMIN"), updateBusinessSettingsValidation, validateRequest, asyncHandler(updateBusinessSettingsController));

module.exports = router;
