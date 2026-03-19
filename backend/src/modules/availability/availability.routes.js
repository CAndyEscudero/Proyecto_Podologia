const { Router } = require("express");
const {
  createBlockedDateController,
  createRuleController,
  deleteBlockedDateController,
  deleteRuleController,
  getAvailableSlotsController,
  listBlockedDatesController,
  listRulesController,
  updateRuleController,
} = require("./availability.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const {
  availabilityRuleValidation,
  blockedDateValidation,
  idValidation,
  slotsQueryValidation,
} = require("./availability.validation");

const router = Router();

router.get("/slots", slotsQueryValidation, validateRequest, asyncHandler(getAvailableSlotsController));
router.get("/rules", requireAuth, asyncHandler(listRulesController));
router.post("/rules", requireAuth, requireRoles("OWNER", "ADMIN"), availabilityRuleValidation, validateRequest, asyncHandler(createRuleController));
router.patch("/rules/:id", requireAuth, requireRoles("OWNER", "ADMIN"), idValidation, availabilityRuleValidation, validateRequest, asyncHandler(updateRuleController));
router.delete("/rules/:id", requireAuth, requireRoles("OWNER", "ADMIN"), idValidation, validateRequest, asyncHandler(deleteRuleController));
router.get("/blocked-dates", requireAuth, asyncHandler(listBlockedDatesController));
router.post("/blocked-dates", requireAuth, requireRoles("OWNER", "ADMIN"), blockedDateValidation, validateRequest, asyncHandler(createBlockedDateController));
router.delete("/blocked-dates/:id", requireAuth, requireRoles("OWNER", "ADMIN"), idValidation, validateRequest, asyncHandler(deleteBlockedDateController));

module.exports = router;
