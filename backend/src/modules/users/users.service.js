const bcrypt = require("bcryptjs");
const { prisma } = require("../../config/prisma");

async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async function createUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: String(data.email).toLowerCase(),
      role: data.role || "ADMIN",
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

module.exports = { createUser, listUsers };
