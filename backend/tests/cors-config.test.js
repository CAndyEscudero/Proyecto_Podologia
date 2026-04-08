const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAllowedOrigins,
  createCorsOriginResolver,
  isDevelopmentOrigin,
} = require("../src/middleware/cors-config");

test("isDevelopmentOrigin permite localhost y subdominios .localhost fuera de produccion", () => {
  assert.equal(isDevelopmentOrigin("http://localhost:5173", "development"), true);
  assert.equal(isDevelopmentOrigin("http://tenant.localhost:5173", "development"), true);
  assert.equal(isDevelopmentOrigin("http://127.0.0.1:5173", "development"), true);
});

test("isDevelopmentOrigin rechaza dominios externos e invalida en produccion", () => {
  assert.equal(isDevelopmentOrigin("https://cliente.com", "development"), false);
  assert.equal(isDevelopmentOrigin("http://tenant.localhost:5173", "production"), false);
  assert.equal(isDevelopmentOrigin("not-a-url", "development"), false);
});

test("createCorsOriginResolver permite origins configurados y bloquea los demas", () => {
  const env = {
    frontendUrl: "https://admin.turnera.com",
    appBaseUrl: "https://app.turnera.com",
  };
  const resolver = createCorsOriginResolver({
    allowedOrigins: buildAllowedOrigins(env),
    nodeEnv: "production",
  });

  let callbackArgs = null;
  resolver("https://admin.turnera.com", (...args) => {
    callbackArgs = args;
  });
  assert.deepEqual(callbackArgs, [null, true]);

  resolver("https://malicioso.com", (...args) => {
    callbackArgs = args;
  });
  assert.equal(callbackArgs[0] instanceof Error, true);
  assert.match(callbackArgs[0].message, /Origin not allowed by CORS/);
});
