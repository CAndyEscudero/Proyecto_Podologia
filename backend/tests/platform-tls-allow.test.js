const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const { env } = require("../src/config/env");
const { prisma } = require("../src/config/prisma");
const { canIssueTlsForHostname } = require("../src/modules/platform/platform.service");
const { tlsAllowDomainController } = require("../src/modules/platform/platform.controller");
const { createMockRequest, createMockResponse } = require("./helpers/http-mocks");

const originalSecret = env.caddyOnDemandAskSecret;
const originalFindUnique = prisma.tenantDomain.findUnique;

test.afterEach(() => {
  env.caddyOnDemandAskSecret = originalSecret;
  prisma.tenantDomain.findUnique = originalFindUnique;
});

test("canIssueTlsForHostname permite el dominio tecnico de plataforma", async () => {
  const allowed = await canIssueTlsForHostname(env.platformApexDomain);
  assert.equal(allowed, true);
});

test("canIssueTlsForHostname rechaza dominios no registrados", async () => {
  prisma.tenantDomain.findUnique = async () => null;
  const allowed = await canIssueTlsForHostname("desconocido.cliente.com");
  assert.equal(allowed, false);
});

test("tlsAllowDomainController permite emitir certificado para dominio registrado", async () => {
  env.caddyOnDemandAskSecret = "super-secret";
  prisma.tenantDomain.findUnique = async () => ({
    hostname: "turnos.cliente.com",
    tenant: {
      id: 1,
      status: "ACTIVE",
    },
  });

  const req = createMockRequest({
    query: {
      secret: "super-secret",
      domain: "turnos.cliente.com",
    },
  });
  const res = createMockResponse();

  await tlsAllowDomainController(req, res);

  assert.equal(res.statusCode, 200);
});

test("tlsAllowDomainController rechaza secreto invalido", async () => {
  env.caddyOnDemandAskSecret = "super-secret";
  const req = createMockRequest({
    query: {
      secret: "otro-secret",
      domain: "turnos.cliente.com",
    },
  });
  const res = createMockResponse();

  await tlsAllowDomainController(req, res);

  assert.equal(res.statusCode, 403);
});
