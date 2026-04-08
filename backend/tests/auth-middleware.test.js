const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const { prisma } = require("../src/config/prisma");
const { requireAuth } = require("../src/middleware/auth");
const { signJwt } = require("../src/utils/jwt");
const {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} = require("./helpers/http-mocks");

const originalFindUnique = prisma.user.findUnique;

test.afterEach(() => {
  prisma.user.findUnique = originalFindUnique;
});

test("requireAuth permite usuario del mismo tenant y subdominio de plataforma", async () => {
  const token = signJwt({ userId: 100, tenantId: 7, role: "OWNER" });
  prisma.user.findUnique = async () => ({
    id: 100,
    tenantId: 7,
    email: "owner@cliente.com",
    fullName: "Owner",
    role: "OWNER",
    isActive: true,
  });

  const req = createMockRequest({
    headers: { authorization: `Bearer ${token}` },
    tenant: {
      id: 7,
      slug: "cliente",
      domainType: "PLATFORM_SUBDOMAIN",
      hostname: "cliente.turnera.com",
    },
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await requireAuth(req, res, next);

  assert.equal(state.called, true);
  assert.equal(req.user.id, 100);
  assert.equal(req.auth.tenantId, 7);
});

test("requireAuth bloquea acceso cruzado si el token pertenece a otro tenant", async () => {
  const token = signJwt({ userId: 100, tenantId: 9, role: "OWNER" });
  prisma.user.findUnique = async () => ({
    id: 100,
    tenantId: 9,
    email: "owner@otro.com",
    fullName: "Owner",
    role: "OWNER",
    isActive: true,
  });

  const req = createMockRequest({
    headers: { authorization: `Bearer ${token}` },
    tenant: {
      id: 7,
      slug: "cliente",
      domainType: "PLATFORM_SUBDOMAIN",
      hostname: "cliente.turnera.com",
    },
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await requireAuth(req, res, next);

  assert.equal(state.called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Forbidden");
});

test("requireAuth bloquea panel admin fuera del subdominio de plataforma", async () => {
  const token = signJwt({ userId: 100, tenantId: 7, role: "OWNER" });

  const req = createMockRequest({
    headers: { authorization: `Bearer ${token}` },
    tenant: {
      id: 7,
      slug: "cliente",
      domainType: "CUSTOM_ROOT",
      hostname: "turnos.cliente.com",
      requestedHostname: "turnos.cliente.com",
    },
  });
  const res = createMockResponse();
  const { next, state } = createNextSpy();

  await requireAuth(req, res, next);

  assert.equal(state.called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "ADMIN_HOST_REQUIRED");
});
