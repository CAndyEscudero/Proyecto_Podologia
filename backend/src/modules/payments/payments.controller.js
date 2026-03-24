const paymentService = require("./payments.service");

async function mercadoPagoWebhookController(req, res) {
  await paymentService.processMercadoPagoWebhook(req.body);
  res.status(200).json({ received: true });
}

module.exports = {
  mercadoPagoWebhookController,
};
