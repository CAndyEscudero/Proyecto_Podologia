const crypto = require("node:crypto");
const { MercadoPagoConnectionStatus } = require("@prisma/client");
const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");
const { logPaymentAudit } = require("./payments.audit");
const { buildPlatformSubdomainHostname } = require("../tenants/tenant-hostnames");

const MERCADO_PAGO_OAUTH_AUTHORIZE_URL = "https://auth.mercadopago.com.ar/authorization";
const MERCADO_PAGO_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const TOKEN_REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;
const LOCAL_HOSTNAME_PATTERN = /(^localhost$)|(^127(?:\.\d{1,3}){3}$)|(\.localhost$)/i;

function buildMercadoPagoBusinessSettingsUpsertData(tenantId, data = {}, tenantName = "Nuevo negocio") {
  return {
    where: { tenantId },
    create: {
      tenantId,
      businessName: tenantName,
      depositPercentage: 50,
      ...data,
    },
    update: data,
  };
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padding = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signStatePayload(encodedPayload) {
  return crypto.createHmac("sha256", env.jwtSecret).update(encodedPayload).digest("hex");
}

function normalizeDateFromExpiresIn(expiresIn) {
  const expiresInSeconds = Number(expiresIn);

  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return null;
  }

  return new Date(Date.now() + expiresInSeconds * 1000);
}

function isLocalHostname(hostname) {
  return typeof hostname === "string" && LOCAL_HOSTNAME_PATTERN.test(hostname.trim().toLowerCase());
}

function buildHostnameBaseUrl(hostname) {
  const fallbackUrl = new URL(env.appBaseUrl);

  if (!hostname) {
    return fallbackUrl.toString();
  }

  const protocol =
    env.nodeEnv !== "production" || isLocalHostname(hostname) ? fallbackUrl.protocol : "https:";
  const shouldReusePort = env.nodeEnv !== "production" || isLocalHostname(hostname);
  const port = shouldReusePort && fallbackUrl.port ? `:${fallbackUrl.port}` : "";

  return `${protocol}//${hostname}${port}`;
}

function buildMercadoPagoOauthState(tenant) {
  const payload = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    nonce: crypto.randomUUID(),
    iat: Date.now(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signStatePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseMercadoPagoOauthState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) {
    throw new AppError("El estado de conexion con Mercado Pago es invalido", 400);
  }

  const [encodedPayload, signature] = state.split(".", 2);
  const expectedSignature = signStatePayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const providedBuffer = Buffer.from(signature || "", "hex");

  if (
    !signature ||
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new AppError("El estado de conexion con Mercado Pago no es confiable", 400);
  }

  let payload;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch (error) {
    throw new AppError("No se pudo interpretar el estado de Mercado Pago", 400);
  }

  const issuedAt = Number(payload?.iat);
  const tenantId = Number(payload?.tenantId);
  const tenantSlug = String(payload?.tenantSlug || "").trim();

  if (!Number.isInteger(tenantId) || tenantId <= 0 || !tenantSlug || !Number.isFinite(issuedAt)) {
    throw new AppError("El estado de Mercado Pago no contiene datos validos", 400);
  }

  if (Date.now() - issuedAt > OAUTH_STATE_TTL_MS) {
    throw new AppError("La conexion con Mercado Pago expiro. Vuelve a intentarlo.", 400);
  }

  return {
    tenantId,
    tenantSlug,
    issuedAt,
  };
}

function ensureMercadoPagoOauthConfigured() {
  if (!env.mercadoPagoOauthClientId || !env.mercadoPagoOauthClientSecret || !env.mercadoPagoOauthRedirectUri) {
    throw new AppError(
      "Falta configurar el OAuth de Mercado Pago en la plataforma",
      503
    );
  }
}

function buildMercadoPagoAuthorizationUrl(tenant) {
  ensureMercadoPagoOauthConfigured();

  const state = buildMercadoPagoOauthState(tenant);
  const url = new URL(MERCADO_PAGO_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", env.mercadoPagoOauthClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", env.mercadoPagoOauthRedirectUri);
  url.searchParams.set("state", state);

  return {
    authorizeUrl: url.toString(),
    state,
  };
}

function buildMercadoPagoOauthAdminReturnUrl(tenant, outcome, details = {}) {
  const adminHostname = buildPlatformSubdomainHostname(tenant.slug);
  const adminBaseUrl = buildHostnameBaseUrl(adminHostname);
  const url = new URL("/admin/dashboard", adminBaseUrl);

  url.searchParams.set("mp_oauth", outcome);

  for (const [key, value] of Object.entries(details)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function serializeMercadoPagoConnection(connection) {
  if (!connection) {
    return {
      status: "DISCONNECTED",
      isConnected: false,
      isOAuth: false,
      accountLabel: null,
      publicKey: null,
      connectedAt: null,
      expiresAt: null,
      lastRefreshedAt: null,
      lastWebhookAt: null,
      lastWebhookStatus: null,
      lastError: null,
      hasRefreshToken: false,
    };
  }

  const accountLabel =
    connection.collectorId || connection.mercadoPagoUserId
      ? `Cuenta Mercado Pago #${connection.collectorId || connection.mercadoPagoUserId}`
      : "Cuenta conectada";

  return {
    status: connection.status,
    isConnected: connection.status === MercadoPagoConnectionStatus.CONNECTED,
    isOAuth: Boolean(connection.accessToken || connection.refreshToken || connection.connectedAt),
    accountLabel,
    publicKey: connection.publicKey || null,
    connectedAt: connection.connectedAt ? connection.connectedAt.toISOString() : null,
    expiresAt: connection.expiresAt ? connection.expiresAt.toISOString() : null,
    lastRefreshedAt: connection.lastRefreshedAt ? connection.lastRefreshedAt.toISOString() : null,
    lastWebhookAt: connection.lastWebhookAt ? connection.lastWebhookAt.toISOString() : null,
    lastWebhookStatus: connection.lastWebhookStatus || null,
    lastError: connection.lastError || null,
    hasRefreshToken: Boolean(connection.refreshToken),
  };
}

async function exchangeMercadoPagoToken(params) {
  ensureMercadoPagoOauthConfigured();

  const form = new URLSearchParams();
  form.set("client_id", env.mercadoPagoOauthClientId);
  form.set("client_secret", env.mercadoPagoOauthClientSecret);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      form.set(key, String(value));
    }
  }

  const response = await fetch(MERCADO_PAGO_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError("No se pudo vincular la cuenta de Mercado Pago", 502, errorBody);
  }

  return response.json();
}

async function completeMercadoPagoOauthCallback({ code, state }) {
  if (!code) {
    throw new AppError("Mercado Pago no devolvio el codigo de autorizacion", 400);
  }

  const parsedState = parseMercadoPagoOauthState(state);
  const tenant = await prisma.tenant.findUnique({
    where: { id: parsedState.tenantId },
  });

  if (!tenant || tenant.slug !== parsedState.tenantSlug) {
    throw new AppError("No se pudo resolver el negocio que quiso conectar Mercado Pago", 404);
  }

  const tokenResponse = await exchangeMercadoPagoToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.mercadoPagoOauthRedirectUri,
    state,
  });

  const expiresAt = normalizeDateFromExpiresIn(tokenResponse.expires_in);
  const connectedAt = new Date();

  const [connection] = await prisma.$transaction([
    prisma.mercadoPagoConnection.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        status: MercadoPagoConnectionStatus.CONNECTED,
        mercadoPagoUserId: tokenResponse.user_id ? String(tokenResponse.user_id) : null,
        collectorId: tokenResponse.user_id ? String(tokenResponse.user_id) : null,
        publicKey: tokenResponse.public_key || null,
        accessToken: tokenResponse.access_token || null,
        refreshToken: tokenResponse.refresh_token || null,
        tokenType: tokenResponse.token_type || null,
        scope: tokenResponse.scope || null,
        liveMode: Boolean(tokenResponse.live_mode),
        connectedAt,
        expiresAt,
        lastRefreshedAt: connectedAt,
        lastError: null,
      },
      update: {
        status: MercadoPagoConnectionStatus.CONNECTED,
        mercadoPagoUserId: tokenResponse.user_id ? String(tokenResponse.user_id) : null,
        collectorId: tokenResponse.user_id ? String(tokenResponse.user_id) : null,
        publicKey: tokenResponse.public_key || null,
        accessToken: tokenResponse.access_token || null,
        refreshToken: tokenResponse.refresh_token || null,
        tokenType: tokenResponse.token_type || null,
        scope: tokenResponse.scope || null,
        liveMode: Boolean(tokenResponse.live_mode),
        connectedAt,
        expiresAt,
        lastRefreshedAt: connectedAt,
        lastError: null,
      },
    }),
    prisma.businessSettings.upsert(
      buildMercadoPagoBusinessSettingsUpsertData(tenant.id, {
        mercadoPagoEnabled: true,
        mercadoPagoPublicKey: tokenResponse.public_key || null,
      }, tenant.name || "Nuevo negocio")
    ),
  ]);

  logPaymentAudit("oauth.connected", {
    tenantId: tenant.id,
    collectorId: connection.collectorId,
    liveMode: connection.liveMode,
    expiresAt: connection.expiresAt?.toISOString() || null,
  });

  return {
    tenant,
    connection,
  };
}

async function getMercadoPagoConnectionByTenantId(tenantId) {
  return prisma.mercadoPagoConnection.findUnique({
    where: { tenantId },
  });
}

function shouldRefreshMercadoPagoConnection(connection) {
  if (!connection?.refreshToken || !connection?.expiresAt) {
    return false;
  }

  return connection.expiresAt.getTime() <= Date.now() + TOKEN_REFRESH_THRESHOLD_MS;
}

async function refreshMercadoPagoConnection(connection) {
  if (!connection?.refreshToken) {
    throw new AppError("La conexion de Mercado Pago no tiene refresh token", 409);
  }

  const tokenResponse = await exchangeMercadoPagoToken({
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
  });

  const refreshedAt = new Date();
  const expiresAt = normalizeDateFromExpiresIn(tokenResponse.expires_in);

  const updated = await prisma.mercadoPagoConnection.update({
    where: { id: connection.id },
    data: {
      status: MercadoPagoConnectionStatus.CONNECTED,
      mercadoPagoUserId: tokenResponse.user_id ? String(tokenResponse.user_id) : connection.mercadoPagoUserId,
      collectorId: tokenResponse.user_id ? String(tokenResponse.user_id) : connection.collectorId,
      publicKey: tokenResponse.public_key || connection.publicKey,
      accessToken: tokenResponse.access_token || connection.accessToken,
      refreshToken: tokenResponse.refresh_token || connection.refreshToken,
      tokenType: tokenResponse.token_type || connection.tokenType,
      scope: tokenResponse.scope || connection.scope,
      liveMode:
        tokenResponse.live_mode === undefined ? connection.liveMode : Boolean(tokenResponse.live_mode),
      expiresAt,
      lastRefreshedAt: refreshedAt,
      lastError: null,
    },
  });

  await prisma.businessSettings.upsert(
    buildMercadoPagoBusinessSettingsUpsertData(connection.tenantId, {
      mercadoPagoPublicKey: updated.publicKey || null,
    })
  );

  logPaymentAudit("oauth.refreshed", {
    tenantId: connection.tenantId,
    collectorId: updated.collectorId,
    expiresAt: updated.expiresAt?.toISOString() || null,
  });

  return updated;
}

async function getFreshMercadoPagoConnection(tenantId) {
  const connection = await getMercadoPagoConnectionByTenantId(tenantId);

  if (!connection || connection.status !== MercadoPagoConnectionStatus.CONNECTED) {
    return connection;
  }

  if (!shouldRefreshMercadoPagoConnection(connection)) {
    return connection;
  }

  try {
    return await refreshMercadoPagoConnection(connection);
  } catch (error) {
    await prisma.mercadoPagoConnection.update({
      where: { id: connection.id },
      data: {
        status: MercadoPagoConnectionStatus.ERROR,
        lastError: error.message,
      },
    });
    throw error;
  }
}

async function disconnectMercadoPagoConnection(tenant) {
  const existing = await prisma.mercadoPagoConnection.findUnique({
    where: { tenantId: tenant.id },
  });

  if (!existing) {
    await prisma.businessSettings.upsert(
      buildMercadoPagoBusinessSettingsUpsertData(tenant.id, {
        mercadoPagoEnabled: false,
      }, tenant.name || "Nuevo negocio")
    );

    return null;
  }

  const updated = await prisma.mercadoPagoConnection.update({
    where: { id: existing.id },
    data: {
      status: MercadoPagoConnectionStatus.DISCONNECTED,
      mercadoPagoUserId: null,
      collectorId: null,
      accessToken: null,
      refreshToken: null,
      publicKey: null,
      tokenType: null,
      scope: null,
      liveMode: false,
      connectedAt: null,
      expiresAt: null,
      lastRefreshedAt: null,
      lastError: null,
    },
  });

  await prisma.businessSettings.upsert(
    buildMercadoPagoBusinessSettingsUpsertData(tenant.id, {
      mercadoPagoEnabled: false,
      mercadoPagoPublicKey: null,
    }, tenant.name || "Nuevo negocio")
  );

  logPaymentAudit("oauth.disconnected", {
    tenantId: tenant.id,
  });

  return updated;
}

async function markMercadoPagoWebhookReceived(tenantId, status = "RECEIVED") {
  const existing = await prisma.mercadoPagoConnection.findUnique({
    where: { tenantId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.mercadoPagoConnection.update({
    where: { id: existing.id },
    data: {
      lastWebhookAt: new Date(),
      lastWebhookStatus: status,
      lastError: null,
    },
  });
}

module.exports = {
  buildMercadoPagoAuthorizationUrl,
  buildMercadoPagoOauthAdminReturnUrl,
  buildMercadoPagoOauthState,
  completeMercadoPagoOauthCallback,
  disconnectMercadoPagoConnection,
  getFreshMercadoPagoConnection,
  getMercadoPagoConnectionByTenantId,
  markMercadoPagoWebhookReceived,
  parseMercadoPagoOauthState,
  serializeMercadoPagoConnection,
};
