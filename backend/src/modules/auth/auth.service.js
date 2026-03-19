const bcrypt = require("bcryptjs");
const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const { signJwt } = require("../../utils/jwt");

async function login({ email, password }) {
  const normalizedEmail = String(email).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.isActive) {
    throw new AppError("Credenciales invalidas", 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new AppError("Credenciales invalidas", 401);
  }

  return {
    token: signJwt({ userId: user.id, role: user.role }),
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

module.exports = { login };
