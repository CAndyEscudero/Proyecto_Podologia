const { buildPlatformSubdomainHostname } = require("../modules/tenants/tenant-hostnames");

function buildAdminHostRequiredPayload(tenant) {
  const adminHostname = tenant?.slug ? buildPlatformSubdomainHostname(tenant.slug) : null;

  return {
    code: "ADMIN_HOST_REQUIRED",
    message: "El panel administrativo de este negocio se opera desde el dominio de plataforma.",
    details: {
      requestedHostname: tenant?.requestedHostname || tenant?.hostname || null,
      currentHostname: tenant?.hostname || null,
      currentDomainType: tenant?.domainType || null,
      adminHostname,
    },
  };
}

function requirePlatformAdminHost(req, res, next) {
  if (!req.tenant?.id) {
    return res.status(401).json({
      message: "Tenant no resuelto",
    });
  }

  if (req.tenant.domainType === "PLATFORM_SUBDOMAIN") {
    return next();
  }

  return res.status(403).json(buildAdminHostRequiredPayload(req.tenant));
}

module.exports = {
  buildAdminHostRequiredPayload,
  requirePlatformAdminHost,
};
