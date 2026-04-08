const { prisma } = require("../config/prisma");
const { env } = require("../config/env");
const { logError, logWarn } = require("../observability/logger");

const BYPASS_PATH_PREFIXES = [
  "/payments/webhook",
  "/payments/return/",
  "/payments/mercadopago/oauth/callback",
];

function shouldBypassTenantResolution(pathname = "") {
  return BYPASS_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function extractHostname(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const firstValue = value.split(",")[0]?.trim();

  if (!firstValue) {
    return null;
  }

  try {
    const target = firstValue.includes("://") ? firstValue : `http://${firstValue}`;
    return new URL(target).hostname.replace(/\.$/, "").toLowerCase();
  } catch (error) {
    const withoutScheme = firstValue.replace(/^[a-z]+:\/\//i, "");
    const withoutPath = withoutScheme.split("/")[0] || "";
    const normalized = withoutPath.replace(/\.$/, "").toLowerCase();
    const hostWithoutPort = normalized.startsWith("[") ? normalized : normalized.split(":")[0];
    return hostWithoutPort || null;
  }
}

function buildHostnameCandidates(req) {
  const candidates = [];
  const rawValues = [
    req.get("x-tenant-host"),
    req.get("x-forwarded-host"),
    req.get("origin"),
    req.get("host"),
  ];

  for (const rawValue of rawValues) {
    const hostname = extractHostname(rawValue);

    if (hostname && !candidates.includes(hostname)) {
      candidates.push(hostname);
    }
  }

  const shouldUseDevelopmentFallback =
    env.nodeEnv !== "production" &&
    env.tenantDevFallbackHostname &&
    candidates.some((hostname) => hostname === "localhost" || hostname === "127.0.0.1");

  if (shouldUseDevelopmentFallback && !candidates.includes(env.tenantDevFallbackHostname)) {
    candidates.push(env.tenantDevFallbackHostname);
  }

  return candidates;
}

function getTenantInactiveMessage(status, tenantName) {
  const safeTenantName = tenantName || "Este negocio";

  switch (status) {
    case "PENDING":
      return `${safeTenantName} todavia no fue publicado.`;
    case "SUSPENDED":
      return `${safeTenantName} se encuentra suspendido temporalmente.`;
    case "CANCELLED":
      return `${safeTenantName} ya no esta disponible en este dominio.`;
    default:
      return `${safeTenantName} no esta activo para operar en este momento.`;
  }
}

async function resolveTenant(req, res, next) {
  if (shouldBypassTenantResolution(req.path)) {
    return next();
  }

  try {
    const hostnames = buildHostnameCandidates(req);

    if (!hostnames.length) {
      logWarn("tenant.resolve.failed", {
        requestId: req.requestId || null,
        reason: "host_unresolved",
        path: req.originalUrl || req.url,
      });
      return res.status(400).json({
        code: "TENANT_HOST_UNRESOLVED",
        message: "No se pudo resolver el tenant del request",
        details: {
          requestedHostname: null,
        },
      });
    }

    const domains = await prisma.tenantDomain.findMany({
      where: {
        hostname: {
          in: hostnames,
        },
      },
      include: {
        tenant: true,
      },
    });

    const domainMap = new Map(domains.map((domain) => [domain.hostname.toLowerCase(), domain]));
    const tenantDomain = hostnames.map((hostname) => domainMap.get(hostname)).find(Boolean);

    if (!tenantDomain) {
      logWarn("tenant.resolve.failed", {
        requestId: req.requestId || null,
        reason: "domain_not_found",
        requestedHostname: hostnames[0] || null,
        candidates: hostnames,
      });
      return res.status(404).json({
        code: "TENANT_DOMAIN_NOT_FOUND",
        message: "Este dominio no esta conectado a un negocio activo.",
        details: {
          requestedHostname: hostnames[0] || null,
        },
      });
    }

    if (tenantDomain.status !== "ACTIVE") {
      logWarn("tenant.resolve.failed", {
        requestId: req.requestId || null,
        reason: "domain_inactive",
        requestedHostname: hostnames[0] || null,
        tenantId: tenantDomain.tenantId,
        domainStatus: tenantDomain.status,
      });
      return res.status(403).json({
        code: "TENANT_DOMAIN_INACTIVE",
        message:
          tenantDomain.status === "PENDING"
            ? "El dominio existe pero todavia no esta habilitado."
            : "El dominio existe, pero tiene un problema de configuracion.",
        details: {
          requestedHostname: hostnames[0] || null,
          domainStatus: tenantDomain.status,
        },
      });
    }

    if (tenantDomain.tenant.status !== "ACTIVE") {
      logWarn("tenant.resolve.failed", {
        requestId: req.requestId || null,
        reason: "tenant_inactive",
        requestedHostname: hostnames[0] || null,
        tenantId: tenantDomain.tenant.id,
        tenantStatus: tenantDomain.tenant.status,
      });
      return res.status(403).json({
        code: "TENANT_INACTIVE",
        message: getTenantInactiveMessage(tenantDomain.tenant.status, tenantDomain.tenant.name),
        details: {
          requestedHostname: hostnames[0] || null,
          tenantStatus: tenantDomain.tenant.status,
          tenantName: tenantDomain.tenant.name,
        },
      });
    }

    req.tenant = {
      id: tenantDomain.tenant.id,
      slug: tenantDomain.tenant.slug,
      name: tenantDomain.tenant.name,
      businessType: tenantDomain.tenant.businessType,
      status: tenantDomain.tenant.status,
      hostname: tenantDomain.hostname,
      domainType: tenantDomain.type,
      domainStatus: tenantDomain.status,
      requestedHostname: hostnames[0] || null,
    };
    req.tenantDomain = tenantDomain;

    next();
  } catch (error) {
    logError("tenant.resolve.exception", {
      requestId: req.requestId || null,
      path: req.originalUrl || req.url,
      message: error.message,
    });
    next(error);
  }
}

module.exports = { resolveTenant };
