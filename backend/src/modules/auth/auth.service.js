const bcrypt = require("bcryptjs");
const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const { signJwt } = require("../../utils/jwt");

async function login({ email, password, tenantId }) {
  const normalizedEmail = String(email).toLowerCase();
  const normalizedTenantId = Number(tenantId || 0);

  if (!normalizedTenantId) {
    throw new AppError("Tenant invalido", 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      tenantId: normalizedTenantId,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("Credenciales invalidas", 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new AppError("Credenciales invalidas", 401);
  }

  return {
    token: signJwt({ userId: user.id, role: user.role, tenantId: user.tenantId }),
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

module.exports = { login };
