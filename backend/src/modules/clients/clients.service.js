const { prisma } = require("../../config/prisma");

function listClients(search = "") {
  return prisma.client.findMany({
    where: search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
}

function getClientById(id) {
  return prisma.client.findUnique({
    where: { id: Number(id) },
    include: { appointments: true },
  });
}

function createClient(data) {
  return prisma.client.create({ data });
}

function updateClient(id, data) {
  return prisma.client.update({
    where: { id: Number(id) },
    data,
  });
}

async function upsertClientByEmailOrPhone(data) {
  if (data.email) {
    const byEmail = await prisma.client.findUnique({ where: { email: data.email } });
    if (byEmail) {
      return prisma.client.update({
        where: { id: byEmail.id },
        data,
      });
    }
  }

  const byPhone = await prisma.client.findFirst({ where: { phone: data.phone } });
  if (byPhone) {
    return prisma.client.update({
      where: { id: byPhone.id },
      data,
    });
  }

  return prisma.client.create({ data });
}

module.exports = { listClients, getClientById, createClient, updateClient, upsertClientByEmailOrPhone };
