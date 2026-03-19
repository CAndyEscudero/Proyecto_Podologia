const { Router } = require("express");
const { createUserController, listUsersController } = require("./users.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");
const { validateRequest } = require("../../middleware/validate-request");
const { createUserValidation } = require("./users.validation");

const router = Router();

router.get("/", requireAuth, requireRoles("OWNER", "ADMIN"), asyncHandler(listUsersController));
router.post("/", requireAuth, requireRoles("OWNER"), createUserValidation, validateRequest, asyncHandler(createUserController));

module.exports = router;
