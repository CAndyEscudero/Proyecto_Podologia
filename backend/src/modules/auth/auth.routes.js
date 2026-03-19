const { Router } = require("express");
const { loginController, meController } = require("./auth.controller");
const { asyncHandler } = require("../../utils/async-handler");
const { loginValidation } = require("./auth.validation");
const { validateRequest } = require("../../middleware/validate-request");
const { requireAuth } = require("../../middleware/auth");
const { createMemoryRateLimit } = require("../../middleware/rate-limit");
const { env } = require("../../config/env");

const router = Router();
const loginRateLimit = createMemoryRateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMax,
  message: "Demasiados intentos de login. Intenta nuevamente mas tarde.",
});

router.post("/login", loginRateLimit, loginValidation, validateRequest, asyncHandler(loginController));
router.get("/me", requireAuth, asyncHandler(meController));

module.exports = router;
