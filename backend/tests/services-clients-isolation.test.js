const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const { prisma } = require("../src/config/prisma");
const { AppError } = require("../src/utils/app-error");
const servicesService = require("../src/modules/services/services.service");
const clientsService = require("../src/modules/clients/clients.service");

const originalServiceFindMany = prisma.service.findMany;
const originalServiceFindFirst = prisma.service.findFirst;
const originalServiceUpdate = prisma.service.update;
const originalClientFindFirst = prisma.client.findFirst;
const originalClientCreate = prisma.client.create;

test.afterEach(() => {
  prisma.service.findMany = originalServiceFindMany;
  prisma.service.findFirst = originalServiceFindFirst;
  prisma.service.update = originalServiceUpdate;
  prisma.client.findFirst = originalClientFindFirst;
  prisma.client.create = originalClientCreate;
});

test("listServices filtra por tenant activo", async () => {
  let receivedArgs = null;
  prisma.service.findMany = async (args) => {
    receivedArgs = args;
    return [];
  };

  await servicesService.listServices(88);

  assert.deepEqual(receivedArgs, {
    where: {
      tenantId: 88,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
});

test("updateService rechaza ids que no pertenecen al tenant", async () => {
  prisma.service.findFirst = async ({ where }) => {
    assert.deepEqual(where, {
      id: 15,
      tenantId: 90,
    });
    return null;
  };

  await assert.rejects(
    () => servicesService.updateService(90, 15, { name: "Nuevo nombre" }),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      /servicio no encontrado/i.test(error.message)
  );
});

test("upsertClientByEmailOrPhone busca y crea siempre dentro del tenant correcto", async () => {
  const receivedFindQueries = [];
  let receivedCreateData = null;

  prisma.client.findFirst = async (args) => {
    receivedFindQueries.push(args);
    return null;
  };

  prisma.client.create = async ({ data }) => {
    receivedCreateData = data;
    return {
      id: 200,
      ...data,
    };
  };

  const created = await clientsService.upsertClientByEmailOrPhone(101, {
    firstName: "Ana",
    lastName: "Perez",
    phone: "3462123456",
    email: "ANA@MAIL.COM",
    notes: "Cliente nueva",
  });

  assert.deepEqual(receivedFindQueries, [
    {
      where: {
        tenantId: 101,
        email: "ana@mail.com",
      },
    },
    {
      where: {
        tenantId: 101,
        phone: "3462123456",
      },
    },
  ]);

  assert.deepEqual(receivedCreateData, {
    tenantId: 101,
    firstName: "Ana",
    lastName: "Perez",
    phone: "3462123456",
    email: "ana@mail.com",
    notes: "Cliente nueva",
  });

  assert.equal(created.tenantId, 101);
  assert.equal(created.email, "ana@mail.com");
});

test("getClientById rechaza clientes fuera del tenant activo", async () => {
  prisma.client.findFirst = async ({ where }) => {
    assert.deepEqual(where, {
      id: 77,
      tenantId: 102,
    });
    return null;
  };

  await assert.rejects(
    () => clientsService.getClientById(102, 77),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      /cliente no encontrado/i.test(error.message)
  );
});
