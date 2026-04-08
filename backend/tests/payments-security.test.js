const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const {
  buildMercadoPagoManifest,
  validateMercadoPagoWebhookSignature,
} = require("../src/modules/payments/payments.security");
const { AppError } = require("../src/utils/app-error");
const { createMockRequest } = require("./helpers/http-mocks");

test("validateMercadoPagoWebhookSignature acepta firma valida", () => {
  const secret = "mp-secret";
  const requestId = "req-123";
  const dataId = "payment-456";
  const timestamp = "1710000000";
  const manifest = buildMercadoPagoManifest({
    dataId,
    requestId,
    timestamp,
  });
  const signature = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const req = createMockRequest({
    headers: {
      "x-request-id": requestId,
      "x-signature": `ts=${timestamp},v1=${signature}`,
    },
    body: {
      data: {
        id: dataId,
      },
    },
    query: {},
  });

  const result = validateMercadoPagoWebhookSignature(req, secret);

  assert.equal(result.enabled, true);
  assert.equal(result.valid, true);
  assert.equal(result.dataId, dataId);
});

test("validateMercadoPagoWebhookSignature rechaza firma invalida", () => {
  const req = createMockRequest({
    headers: {
      "x-request-id": "req-123",
      "x-signature": "ts=1710000000,v1=abcdef",
    },
    body: {
      data: {
        id: "payment-456",
      },
    },
  });

  assert.throws(
    () => validateMercadoPagoWebhookSignature(req, "mp-secret"),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 401 &&
      /firma no valida/i.test(error.message)
  );
});
