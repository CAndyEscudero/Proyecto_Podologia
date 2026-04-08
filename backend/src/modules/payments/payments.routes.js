const { Router } = require("express");
const { asyncHandler } = require("../../utils/async-handler");
const {
  disconnectMercadoPagoConnectionController,
  mercadoPagoOauthCallbackController,
  mercadoPagoOauthStartController,
  mercadoPagoReturnController,
  mercadoPagoWebhookController,
} = require("./payments.controller");
const { requireAuth } = require("../../middleware/auth");
const { requireRoles } = require("../../middleware/require-roles");

const router = Router();

router.post(
  "/mercadopago/oauth/start",
  requireAuth,
  requireRoles("OWNER", "ADMIN"),
  asyncHandler(mercadoPagoOauthStartController)
);
router.get("/mercadopago/oauth/callback", asyncHandler(mercadoPagoOauthCallbackController));
router.delete(
  "/mercadopago/connection",
  requireAuth,
  requireRoles("OWNER", "ADMIN"),
  asyncHandler(disconnectMercadoPagoConnectionController)
);
router.post("/webhook", asyncHandler(mercadoPagoWebhookController));
router.get("/return/:status", asyncHandler(mercadoPagoReturnController));

module.exports = router;
