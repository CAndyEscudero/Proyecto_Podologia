const crypto = require("node:crypto");
const { AppError } = require("../../utils/app-error");

function parseMercadoPagoSignature(signatureHeader) {
  if (!signatureHeader) {
    return { ts: null, v1: null };
  }

  return signatureHeader.split(",").reduce(
    (accumulator, part) => {
      const [key, value] = part.split("=", 2).map((segment) => segment?.trim());

      if (key === "ts") {
        accumulator.ts = value || null;
      }

      if (key === "v1") {
        accumulator.v1 = value || null;
      }

      return accumulator;
    },
    { ts: null, v1: null }
  );
}

function buildMercadoPagoManifest({ dataId, requestId, timestamp }) {
  return `id:${dataId};request-id:${requestId};ts:${timestamp};`;
}

function extractMercadoPagoDataId(req) {
  if (req.query?.["data.id"]) {
    return String(req.query["data.id"]);
  }

  if (req.body?.data?.id) {
    return String(req.body.data.id);
  }

  if (req.body?.id) {
    return String(req.body.id);
  }

  return null;
}

function safeCompareSignatures(expected, actual) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function validateMercadoPagoWebhookSignature(req, secret) {
  if (!secret) {
    return {
      enabled: false,
      valid: true,
      reason: "missing_secret",
      dataId: extractMercadoPagoDataId(req),
    };
  }

  const requestId = req.get("x-request-id");
  const signatureHeader = req.get("x-signature");
  const dataId = extractMercadoPagoDataId(req);
  const { ts, v1 } = parseMercadoPagoSignature(signatureHeader);

  if (!requestId || !signatureHeader || !dataId || !ts || !v1) {
    throw new AppError("Webhook de Mercado Pago invalido: faltan datos de firma", 401);
  }

  const manifest = buildMercadoPagoManifest({
    dataId,
    requestId,
    timestamp: ts,
  });

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (!safeCompareSignatures(expectedSignature, v1)) {
    throw new AppError("Webhook de Mercado Pago invalido: firma no valida", 401);
  }

  return {
    enabled: true,
    valid: true,
    dataId,
    requestId,
    timestamp: ts,
  };
}

module.exports = {
  buildMercadoPagoManifest,
  extractMercadoPagoDataId,
  parseMercadoPagoSignature,
  validateMercadoPagoWebhookSignature,
};
