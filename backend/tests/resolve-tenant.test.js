const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const { env } = require("../src/config/env");
const { prisma } = require("../src/config/prisma");
const { resolveTenant } = require("../src/middleware/resolve-tenant");
const {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} = require("./helpers/http-mocks");

const originalFindMany = prisma.tenantDomain.findMany;

test.afterEach(() => {
  prisma.tenantDomain.findMany = originalFindMany;
});

test("resolveTenant carga req.tenant cuando encuentra un dominio activo", async () => {
  prisma.tenantDomain.findMany = async () => [
    {
      id: 1,
      tenantId: 10,
      hostname: "cliente.turnera.com",
      type: "PLATFORM_SUBDOMAIN",
      status: "ACTIVE",
      tenant: {
        id: 10,
        slug: "cliente",
        name: "Cliente Uno",
        businessType: "HAIR",
        status: "ACTIVE",
      },
    },
  ];

  const req = createMockRequest({
    headers: { host: "cliente.turnera.com" },
    path: "/services",
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await resolveTenant(req, res, next);

  assert.equal(state.called, true);
  assert.equal(state.error, null);
  assert.equal(req.tenant.id, 10);
  assert.equal(req.tenant.slug, "cliente");
  assert.equal(req.tenant.hostname, "cliente.turnera.com");
});

test("resolveTenant devuelve 404 si el dominio no existe", async () => {
  prisma.tenantDomain.findMany = async () => [];

  const req = createMockRequest({
    headers: { host: "desconocido.turnera.com" },
    path: "/services",
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await resolveTenant(req, res, next);

  assert.equal(state.called, false);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.code, "TENANT_DOMAIN_NOT_FOUND");
});

test("resolveTenant usa fallback localhost en desarrollo", async () => {
  let receivedCandidates = null;
  prisma.tenantDomain.findMany = async ({ where }) => {
    receivedCandidates = where.hostname.in;
    return [
      {
        id: 2,
        tenantId: 11,
        hostname: env.tenantDevFallbackHostname,
        type: "PLATFORM_SUBDOMAIN",
        status: "ACTIVE",
        tenant: {
          id: 11,
          slug: "tenant-demo",
          name: "Tenant Demo",
          businessType: null,
          status: "ACTIVE",
        },
      },
    ];
  };

  const req = createMockRequest({
    headers: { host: "localhost:5173" },
    path: "/services",
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await resolveTenant(req, res, next);

  assert.equal(state.called, true);
  assert.equal(receivedCandidates.includes("localhost"), true);
  assert.equal(receivedCandidates.includes(env.tenantDevFallbackHostname), true);
  assert.equal(req.tenant.hostname, env.tenantDevFallbackHostname);
});

test("resolveTenant bloquea tenants inactivos", async () => {
  prisma.tenantDomain.findMany = async () => [
    {
      id: 3,
      tenantId: 12,
      hostname: "suspendido.turnera.com",
      type: "PLATFORM_SUBDOMAIN",
      status: "ACTIVE",
      tenant: {
        id: 12,
        slug: "suspendido",
        name: "Suspendido",
        businessType: null,
        status: "SUSPENDED",
      },
    },
  ];

  const req = createMockRequest({
    headers: { host: "suspendido.turnera.com" },
    path: "/services",
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await resolveTenant(req, res, next);

  assert.equal(state.called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "TENANT_INACTIVE");
});

test("resolveTenant acepta dominios custom activos y preserva el tipo de dominio", async () => {
  prisma.tenantDomain.findMany = async () => [
    {
      id: 4,
      tenantId: 13,
      hostname: "turnos.cliente.com",
      type: "CUSTOM_ROOT",
      status: "ACTIVE",
      tenant: {
        id: 13,
        slug: "cliente-custom",
        name: "Cliente Custom",
        businessType: "NAILS",
        status: "ACTIVE",
      },
    },
  ];

  const req = createMockRequest({
    headers: { host: "turnos.cliente.com" },
    path: "/services",
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await resolveTenant(req, res, next);

  assert.equal(state.called, true);
  assert.equal(req.tenant.id, 13);
  assert.equal(req.tenant.domainType, "CUSTOM_ROOT");
  assert.equal(req.tenant.hostname, "turnos.cliente.com");
});
