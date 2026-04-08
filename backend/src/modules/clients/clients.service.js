const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");

async function getClientOrThrow(tenantId, id) {
  const client = await prisma.client.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
    include: { appointments: true },
  });

  if (!client) {
    throw new AppError("Cliente no encontrado", 404);
  }

  return client;
}

function listClients(tenantId, search = "") {
  return prisma.client.findMany({
    where: {
      tenantId,
      ...(search
        ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
          ],
        }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

function getClientById(tenantId, id) {
  return getClientOrThrow(tenantId, id);
}

function createClient(tenantId, data) {
  return prisma.client.create({
    data: {
      tenantId,
      ...data,
    },
  });
}

async function updateClient(tenantId, id, data) {
  await getClientOrThrow(tenantId, id);

  return prisma.client.update({
    where: { id: Number(id) },
    data,
  });
}

async function upsertClientByEmailOrPhone(tenantId, data) {
  const normalizedEmail = data.email ? String(data.email).toLowerCase() : null;

  if (data.email) {
    const byEmail = await prisma.client.findFirst({
      where: {
        tenantId,
        email: normalizedEmail,
      },
    });

    if (byEmail) {
      return prisma.client.update({
        where: { id: byEmail.id },
        data: {
          ...data,
          email: normalizedEmail,
        },
      });
    }
  }

  const byPhone = await prisma.client.findFirst({
    where: {
      tenantId,
      phone: data.phone,
    },
  });

  if (byPhone) {
    return prisma.client.update({
      where: { id: byPhone.id },
      data: {
        ...data,
        email: normalizedEmail,
      },
    });
  }

  return prisma.client.create({
    data: {
      tenantId,
      ...data,
      email: normalizedEmail,
    },
  });
}

module.exports = { listClients, getClientById, createClient, updateClient, upsertClientByEmailOrPhone };
