const { prisma } = require("../../config/prisma");

function listServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

function createService(data) {
  return prisma.service.create({ data });
}

function updateService(id, data) {
  return prisma.service.update({
    where: { id: Number(id) },
    data,
  });
}

function deleteService(id) {
  return prisma.service.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
}

module.exports = { listServices, createService, updateService, deleteService };
