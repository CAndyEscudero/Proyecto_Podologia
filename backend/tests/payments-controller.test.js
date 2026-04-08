const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const paymentService = require("../src/modules/payments/payments.service");
const { mercadoPagoWebhookController } = require("../src/modules/payments/payments.controller");
const { buildMercadoPagoManifest } = require("../src/modules/payments/payments.security");
const {
  createMockRequest,
  createMockResponse,
} = require("./helpers/http-mocks");

const originalGetSecret = paymentService.getMercadoPagoWebhookSecret;
const originalProcessWebhook = paymentService.processMercadoPagoWebhook;

test.afterEach(() => {
  paymentService.getMercadoPagoWebhookSecret = originalGetSecret;
  paymentService.processMercadoPagoWebhook = originalProcessWebhook;
});

test("mercadoPagoWebhookController procesa el webhook usando el tenantId del callback", async () => {
  let receivedTenantIdForSecret = null;
  let receivedTenantIdForProcessing = null;
  const tenantId = 22;
  const secret = "mp-secret";
  const requestId = "mp-request-1";
  const paymentId = "payment-999";
  const timestamp = "1710000000";
  const manifest = buildMercadoPagoManifest({
    dataId: paymentId,
    requestId,
    timestamp,
  });
  const signature = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  paymentService.getMercadoPagoWebhookSecret = async (value) => {
    receivedTenantIdForSecret = value;
    return secret;
  };
  paymentService.processMercadoPagoWebhook = async (_payload, value) => {
    receivedTenantIdForProcessing = value;
  };

  const req = createMockRequest({
    method: "POST",
    path: "/payments/webhook",
    query: { tenantId: String(tenantId) },
    headers: {
      "x-request-id": requestId,
      "x-signature": `ts=${timestamp},v1=${signature}`,
      host: "api.turnera.com",
    },
    body: {
      type: "payment",
      data: {
        id: paymentId,
      },
    },
  });
  const res = createMockResponse();

  await mercadoPagoWebhookController(req, res);

  assert.equal(receivedTenantIdForSecret, tenantId);
  assert.equal(receivedTenantIdForProcessing, tenantId);
  assert.equal(req.tenant.id, tenantId);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { received: true });
});
