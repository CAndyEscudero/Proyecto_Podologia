const { prisma } = require("../../config/prisma");

async function getBusinessSettings() {
  const existing = await prisma.businessSettings.findFirst();

  if (existing) {
    return existing;
  }

  return prisma.businessSettings.create({
    data: {
      businessName: "Pies Sanos Venado",
    },
  });
}

async function updateBusinessSettings(data) {
  const current = await getBusinessSettings();
  return prisma.businessSettings.update({
    where: { id: current.id },
    data,
  });
}

module.exports = { getBusinessSettings, updateBusinessSettings };
