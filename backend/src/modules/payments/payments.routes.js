const { Router } = require("express");
const { asyncHandler } = require("../../utils/async-handler");
const {
  mercadoPagoReturnController,
  mercadoPagoWebhookController,
} = require("./payments.controller");

const router = Router();

router.post("/webhook", asyncHandler(mercadoPagoWebhookController));
router.get("/return/:status", asyncHandler(mercadoPagoReturnController));

module.exports = router;
