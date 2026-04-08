const { prisma } = require("../config/prisma");
const { verifyJwt } = require("../utils/jwt");
const { buildAdminHostRequiredPayload } = require("./require-platform-admin-host");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifyJwt(token);

    if (!payload?.userId || !payload?.tenantId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!req.tenant?.id) {
      return res.status(401).json({ message: "Tenant no resuelto" });
    }

    if (req.tenant.domainType !== "PLATFORM_SUBDOMAIN") {
      return res.status(403).json(buildAdminHostRequiredPayload(req.tenant));
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.tenantId !== payload.tenantId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (user.tenantId !== req.tenant.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.auth = payload;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { requireAuth };
