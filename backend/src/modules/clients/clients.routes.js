const { Router } = require("express");
const {
  listClientsController,
  getClientController,
  createClientController,
  updateClientController,
} = require("./clients.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const { createClientValidation, clientIdValidation } = require("./clients.validation");

const router = Router();

router.get("/", requireAuth, asyncHandler(listClientsController));
router.get("/:id", requireAuth, clientIdValidation, validateRequest, asyncHandler(getClientController));
router.post("/", requireAuth, requireRoles("OWNER", "ADMIN", "STAFF"), createClientValidation, validateRequest, asyncHandler(createClientController));
router.patch("/:id", requireAuth, requireRoles("OWNER", "ADMIN", "STAFF"), clientIdValidation, createClientValidation, validateRequest, asyncHandler(updateClientController));

module.exports = router;
