const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");

async function getServiceOrThrow(tenantId, id) {
  const service = await prisma.service.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });

  if (!service) {
    throw new AppError("Servicio no encontrado", 404);
  }

  return service;
}

function listServices(tenantId) {
  return prisma.service.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

function createService(tenantId, data) {
  return prisma.service.create({
    data: {
      tenantId,
      ...data,
    },
  });
}

async function updateService(tenantId, id, data) {
  await getServiceOrThrow(tenantId, id);

  return prisma.service.update({
    where: { id: Number(id) },
    data,
  });
}

async function deleteService(tenantId, id) {
  await getServiceOrThrow(tenantId, id);

  return prisma.service.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
}

module.exports = { listServices, createService, updateService, deleteService };
