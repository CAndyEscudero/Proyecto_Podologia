const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");

function normalizeHostname(value) {
  const input = String(value || "").trim().toLowerCase();

  if (!input) {
    return "";
  }

  try {
    const target = input.includes("://") ? input : `http://${input}`;
    return new URL(target).hostname.replace(/\.$/, "").toLowerCase();
  } catch (error) {
    return input.replace(/^[a-z]+:\/\//i, "").split("/")[0]?.replace(/\.$/, "").toLowerCase() || "";
  }
}

function isPlatformTechnicalHostname(hostname) {
  const platformApex = String(env.platformApexDomain || "").trim().toLowerCase();
  return Boolean(platformApex && hostname === platformApex);
}

async function canIssueTlsForHostname(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return false;
  }

  if (isPlatformTechnicalHostname(normalizedHostname)) {
    return true;
  }

  const tenantDomain = await prisma.tenantDomain.findUnique({
    where: { hostname: normalizedHostname },
    include: {
      tenant: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!tenantDomain || !tenantDomain.tenant) {
    return false;
  }

  return tenantDomain.tenant.status !== "CANCELLED";
}

module.exports = {
  canIssueTlsForHostname,
  isPlatformTechnicalHostname,
  normalizeHostname,
};
