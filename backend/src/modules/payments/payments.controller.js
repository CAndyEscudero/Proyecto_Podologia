const paymentService = require("./payments.service");
const { env } = require("../../config/env");

async function mercadoPagoWebhookController(req, res) {
  await paymentService.processMercadoPagoWebhook(req.body);
  res.status(200).json({ received: true });
}

function buildFrontendReturnUrl(status, query = {}) {
  const frontendUrl = new URL("/reservas/resultado", env.appBaseUrl);
  frontendUrl.searchParams.set("status", status);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      frontendUrl.searchParams.set(key, String(value));
    }
  }

  return frontendUrl.toString();
}

async function mercadoPagoReturnController(req, res) {
  const { status } = req.params;
  const redirectUrl = buildFrontendReturnUrl(status, req.query);
  res.redirect(302, redirectUrl);
}

module.exports = {
  mercadoPagoReturnController,
  mercadoPagoWebhookController,
};
