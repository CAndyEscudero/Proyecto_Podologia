const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const {
  buildMercadoPagoManifest,
  parseMercadoPagoSignature,
  validateMercadoPagoWebhookSignature,
} = require("../backend/src/modules/payments/payments.security");

function buildRequest({ dataId, requestId, timestamp, signature }) {
  const headers = {
    "x-request-id": requestId,
    "x-signature": signature,
  };

  return {
    query: {
      "data.id": dataId,
    },
    body: {
      data: {
        id: dataId,
      },
      type: "payment",
    },
    get(name) {
      return headers[name.toLowerCase()] || null;
    },
  };
}

function run() {
  const secret = "super-secret-test-key";
  const dataId = "123456";
  const requestId = "request-abc";
  const timestamp = "1711300000";
  const manifest = buildMercadoPagoManifest({ dataId, requestId, timestamp });
  const expectedSignature = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const signatureHeader = `ts=${timestamp},v1=${expectedSignature}`;

  const parsed = parseMercadoPagoSignature(signatureHeader);
  assert.equal(parsed.ts, timestamp, "El timestamp debe parsearse correctamente.");
  assert.equal(parsed.v1, expectedSignature, "La firma debe parsearse correctamente.");

  const validation = validateMercadoPagoWebhookSignature(
    buildRequest({
      dataId,
      requestId,
      timestamp,
      signature: signatureHeader,
    }),
    secret
  );

  assert.equal(validation.valid, true, "La firma valida deberia aceptarse.");
  assert.equal(validation.enabled, true, "La validacion deberia estar habilitada si hay secret.");
  assert.equal(validation.dataId, dataId, "El data.id validado deberia conservarse.");

  assert.throws(
    () =>
      validateMercadoPagoWebhookSignature(
        buildRequest({
          dataId,
          requestId,
          timestamp,
          signature: `ts=${timestamp},v1=deadbeef`,
        }),
        secret
      ),
    /firma no valida/,
    "Una firma incorrecta deberia rechazarse."
  );

  const skippedValidation = validateMercadoPagoWebhookSignature(
    buildRequest({
      dataId,
      requestId,
      timestamp,
      signature: signatureHeader,
    }),
    ""
  );

  assert.equal(skippedValidation.enabled, false, "Sin secret, la validacion deberia quedar deshabilitada.");

  console.log(
    JSON.stringify(
      {
        checked: true,
        manifest,
        signatureValidated: validation.valid,
        signatureSkippedWithoutSecret: skippedValidation.enabled === false,
      },
      null,
      2
    )
  );
}

run();
