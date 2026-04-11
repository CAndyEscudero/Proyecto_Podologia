const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function loadAppWithEnv(overrides = {}) {
  const previousEnv = new Map();

  for (const [key, value] of Object.entries(overrides)) {
    previousEnv.set(key, process.env[key]);
    process.env[key] = value;
  }

  clearModule("../src/config/env");
  clearModule("../src/app");

  const { app } = require("../src/app");

  return {
    app,
    restore() {
      clearModule("../src/app");
      clearModule("../src/config/env");

      for (const [key, value] of previousEnv.entries()) {
        if (value === undefined) {
          delete process.env[key];
          continue;
        }

        process.env[key] = value;
      }
    },
  };
}

test("app permite origenes de subdominios de plataforma en produccion", async (t) => {
  const { app, restore } = loadAppWithEnv({
    NODE_ENV: "production",
    FRONTEND_URL: "https://resergo.com.ar",
    APP_BASE_URL: "https://resergo.com.ar",
    PLATFORM_APEX_DOMAIN: "resergo.com.ar",
  });

  const server = app.listen(0);
  await once(server, "listening");

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    restore();
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: {
      Origin: "https://pies-sanos-venado.resergo.com.ar",
    },
  });

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://pies-sanos-venado.resergo.com.ar"
  );
});
