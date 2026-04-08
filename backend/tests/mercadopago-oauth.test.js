const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET = "test-secret";
process.env.MERCADO_PAGO_OAUTH_CLIENT_ID = "app-123";
process.env.MERCADO_PAGO_OAUTH_CLIENT_SECRET = "secret-456";
process.env.MERCADO_PAGO_OAUTH_REDIRECT_URI =
  "https://turnos.example.com/api/payments/mercadopago/oauth/callback";
process.env.APP_BASE_URL = "https://turnos.example.com";
process.env.PLATFORM_APEX_DOMAIN = "turnos.example.com";
process.env.MERCADO_PAGO_PLATFORM_WEBHOOK_SECRET = "platform-webhook-secret";

function loadOauthService() {
  delete require.cache[require.resolve("../src/config/env")];
  delete require.cache[require.resolve("../src/modules/payments/mercadopago-oauth.service")];
  return require("../src/modules/payments/mercadopago-oauth.service");
}

const { prisma } = require("../src/config/prisma");

const originalFetch = global.fetch;
const originalTenantFindUnique = prisma.tenant.findUnique;
const originalTransaction = prisma.$transaction;
const originalConnectionFindUnique = prisma.mercadoPagoConnection.findUnique;
const originalConnectionUpsert = prisma.mercadoPagoConnection.upsert;
const originalConnectionUpdate = prisma.mercadoPagoConnection.update;
const originalBusinessSettingsUpsert = prisma.businessSettings.upsert;

test.afterEach(() => {
  global.fetch = originalFetch;
  prisma.tenant.findUnique = originalTenantFindUnique;
  prisma.$transaction = originalTransaction;
  prisma.mercadoPagoConnection.findUnique = originalConnectionFindUnique;
  prisma.mercadoPagoConnection.upsert = originalConnectionUpsert;
  prisma.mercadoPagoConnection.update = originalConnectionUpdate;
  prisma.businessSettings.upsert = originalBusinessSettingsUpsert;
});

test("buildMercadoPagoAuthorizationUrl genera URL de OAuth con state firmado", () => {
  const oauthService = loadOauthService();
  const tenant = { id: 17, slug: "pelu-luna" };

  const { authorizeUrl, state } = oauthService.buildMercadoPagoAuthorizationUrl(tenant);
  const parsedUrl = new URL(authorizeUrl);
  const parsedState = oauthService.parseMercadoPagoOauthState(state);

  assert.equal(parsedUrl.origin, "https://auth.mercadopago.com.ar");
  assert.equal(parsedUrl.searchParams.get("client_id"), "app-123");
  assert.equal(parsedUrl.searchParams.get("response_type"), "code");
  assert.equal(parsedUrl.searchParams.get("platform_id"), "mp");
  assert.equal(
    parsedUrl.searchParams.get("redirect_uri"),
    "https://turnos.example.com/api/payments/mercadopago/oauth/callback"
  );
  assert.equal(parsedUrl.searchParams.get("state"), state);
  assert.equal(parsedState.tenantId, tenant.id);
  assert.equal(parsedState.tenantSlug, tenant.slug);
});

test("completeMercadoPagoOauthCallback guarda la conexion OAuth y habilita cobros online", async () => {
  const oauthService = loadOauthService();
  const tenant = { id: 21, slug: "barberia-luca", name: "Barberia Luca" };
  const { state } = oauthService.buildMercadoPagoAuthorizationUrl(tenant);
  const tokenResponse = {
    access_token: "seller-access-token",
    public_key: "APP_USR-public",
    refresh_token: "refresh-token",
    live_mode: true,
    user_id: 998877,
    token_type: "bearer",
    expires_in: 3600,
    scope: "offline_access payments write",
  };

  prisma.tenant.findUnique = async ({ where }) =>
    where.id === tenant.id ? tenant : null;
  prisma.mercadoPagoConnection.upsert = async ({ create }) => ({
    id: 5,
    ...create,
  });
  prisma.businessSettings.upsert = async ({ create, update }) => ({
    id: 9,
    ...create,
    ...update,
  });
  prisma.$transaction = async (operations) => Promise.all(operations);
  global.fetch = async (url, options) => {
    assert.equal(url, "https://api.mercadopago.com/oauth/token");
    assert.equal(options.method, "POST");
    const body = String(options.body);
    assert.match(body, /grant_type=authorization_code/);
    assert.match(body, /client_id=app-123/);
    assert.match(body, /client_secret=secret-456/);
    assert.match(body, /code=oauth-code-123/);

    return {
      ok: true,
      async json() {
        return tokenResponse;
      },
    };
  };

  const result = await oauthService.completeMercadoPagoOauthCallback({
    code: "oauth-code-123",
    state,
  });

  assert.equal(result.tenant.id, tenant.id);
  assert.equal(result.connection.status, "CONNECTED");
  assert.equal(result.connection.collectorId, String(tokenResponse.user_id));
  assert.equal(result.connection.publicKey, tokenResponse.public_key);
  assert.equal(result.connection.accessToken, tokenResponse.access_token);
  assert.equal(result.connection.refreshToken, tokenResponse.refresh_token);
  assert.equal(result.connection.liveMode, true);
});

test("disconnectMercadoPagoConnection limpia la vinculacion OAuth del tenant", async () => {
  const oauthService = loadOauthService();
  const tenant = { id: 31, slug: "estetica-sofi", name: "Estetica Sofi" };
  const existingConnection = {
    id: 44,
    tenantId: tenant.id,
    status: "CONNECTED",
    collectorId: "776655",
    mercadoPagoUserId: "776655",
  };

  prisma.mercadoPagoConnection.findUnique = async ({ where }) =>
    where.tenantId === tenant.id ? existingConnection : null;
  prisma.mercadoPagoConnection.update = async ({ where, data }) => ({
    id: where.id,
    tenantId: tenant.id,
    ...data,
  });
  prisma.businessSettings.upsert = async ({ create, update }) => ({
    id: 55,
    ...create,
    ...update,
  });

  const result = await oauthService.disconnectMercadoPagoConnection(tenant);

  assert.equal(result.status, "DISCONNECTED");
  assert.equal(result.collectorId, null);
  assert.equal(result.mercadoPagoUserId, null);
  assert.equal(result.accessToken, null);
  assert.equal(result.refreshToken, null);
  assert.equal(result.publicKey, null);
});
