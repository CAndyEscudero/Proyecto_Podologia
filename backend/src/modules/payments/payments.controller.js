const paymentService = require("./payments.service");
const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const { logPaymentAudit } = require("./payments.audit");
const { validateMercadoPagoWebhookSignature } = require("./payments.security");
const { logWarn } = require("../../observability/logger");
const {
  buildMercadoPagoAuthorizationUrl,
  buildMercadoPagoOauthAdminReturnUrl,
  completeMercadoPagoOauthCallback,
  disconnectMercadoPagoConnection,
  markMercadoPagoWebhookReceived,
  parseMercadoPagoOauthState,
} = require("./mercadopago-oauth.service");

function normalizeTenantId(value) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedId = Number(rawValue);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

function resolveTenantIdFromRequest(req) {
  const tenantId = normalizeTenantId(req.query?.tenantId);

  if (!tenantId) {
    throw new AppError("Falta tenantId en el callback de Mercado Pago", 400);
  }

  return tenantId;
}

async function mercadoPagoWebhookController(req, res) {
  const tenantId = resolveTenantIdFromRequest(req);
  req.tenant = req.tenant || {
    id: tenantId,
    requestedHostname: req.get("host") || null,
    hostname: null,
    domainType: null,
  };
  const webhookSecret = await paymentService.getMercadoPagoWebhookSecret(tenantId);
  const signatureResult = validateMercadoPagoWebhookSignature(req, webhookSecret);
  const dataId = signatureResult.dataId || req.body?.data?.id || req.body?.id || null;

  logPaymentAudit("webhook.received", {
    tenantId,
    dataId,
    signatureValidated: signatureResult.enabled,
    requestId: signatureResult.requestId || req.get("x-request-id") || null,
    topic: req.body?.type || req.body?.topic || null,
  });

  const result = await paymentService.processMercadoPagoWebhook(req.body, tenantId);

  try {
    await markMercadoPagoWebhookReceived(
      tenantId,
      result?.status || req.body?.type || req.body?.topic || "RECEIVED"
    );
  } catch (error) {
    logWarn("webhook.heartbeat_failed", {
      tenantId,
      message: error.message,
    });
  }

  res.status(200).json({ received: true });
}

async function mercadoPagoReturnController(req, res) {
  const { status } = req.params;
  const tenantId = resolveTenantIdFromRequest(req);
  req.tenant = req.tenant || {
    id: tenantId,
    requestedHostname: req.get("host") || null,
    hostname: null,
    domainType: null,
  };
  const redirectUrl = await paymentService.buildTenantFrontendReturnUrl(tenantId, status, req.query);
  res.redirect(302, redirectUrl);
}

async function mercadoPagoOauthStartController(req, res) {
  const { authorizeUrl } = buildMercadoPagoAuthorizationUrl(req.tenant);

  logPaymentAudit("oauth.start", {
    tenantId: req.tenant.id,
    tenantSlug: req.tenant.slug,
  });

  res.json({ authorizeUrl });
}

async function mercadoPagoOauthCallbackController(req, res) {
  const { code, state, error, error_description: errorDescription } = req.query;
  let tenantForRedirect = null;

  try {
    if (error) {
      throw new AppError(
        errorDescription
          ? `Mercado Pago rechazo la vinculacion: ${String(errorDescription)}`
          : "Mercado Pago rechazo la vinculacion",
        400
      );
    }

    const { tenant } = await completeMercadoPagoOauthCallback({
      code: Array.isArray(code) ? code[0] : code,
      state: Array.isArray(state) ? state[0] : state,
    });

    const successUrl = buildMercadoPagoOauthAdminReturnUrl(tenant, "success");
    return res.redirect(302, successUrl);
  } catch (errorCaught) {
    try {
      const parsedState = parseMercadoPagoOauthState(Array.isArray(state) ? state[0] : state);
      tenantForRedirect = await prisma.tenant.findUnique({
        where: { id: parsedState.tenantId },
      });
    } catch (_ignored) {
      tenantForRedirect = null;
    }

    logPaymentAudit("oauth.callback_failed", {
      tenantId: tenantForRedirect?.id || null,
      message: errorCaught.message,
    });

    if (tenantForRedirect) {
      const failureUrl = buildMercadoPagoOauthAdminReturnUrl(tenantForRedirect, "error", {
        reason: errorCaught.message,
      });
      return res.redirect(302, failureUrl);
    }

    throw errorCaught;
  }
}

async function disconnectMercadoPagoConnectionController(req, res) {
  await disconnectMercadoPagoConnection(req.tenant);
  res.status(204).send();
}

module.exports = {
  disconnectMercadoPagoConnectionController,
  mercadoPagoOauthCallbackController,
  mercadoPagoOauthStartController,
  mercadoPagoReturnController,
  mercadoPagoWebhookController,
};
