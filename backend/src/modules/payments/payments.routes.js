const { Router } = require("express");
const { asyncHandler } = require("../../utils/async-handler");
const { mercadoPagoWebhookController } = require("./payments.controller");

const router = Router();

router.post("/webhook", asyncHandler(mercadoPagoWebhookController));

module.exports = router;
