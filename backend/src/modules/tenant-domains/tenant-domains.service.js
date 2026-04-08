const dns = require("node:dns/promises");
const {
  TenantDomainStatus,
  TenantDomainType,
} = require("@prisma/client");
const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");
const { logTenantDomainAudit } = require("./tenant-domains.audit");

const CUSTOM_DOMAIN_TYPES = [
  TenantDomainType.CUSTOM_ROOT,
  TenantDomainType.CUSTOM_SUBDOMAIN,
];

const MULTIPART_PUBLIC_SUFFIXES = new Set([
  "com.ar",
  "com.au",
  "com.bo",
  "com.br",
  "com.co",
  "com.ec",
  "com.es",
  "com.mx",
  "com.pe",
  "com.py",
  "com.uy",
  "com.ve",
  "co.uk",
  "net.au",
  "org.uk",
]);

function normalizeHostname(value) {
  const input = String(value || "").trim().toLowerCase();

  if (!input) {
    return "";
  }

  const trimmed = input.replace(/\.$/, "");

  try {
    const target = trimmed.includes("://") ? trimmed : `http://${trimmed}`;
    return new URL(target).hostname.replace(/\.$/, "").toLowerCase();
  } catch (error) {
    return trimmed.replace(/^[a-z]+:\/\//i, "").split("/")[0]?.replace(/\.$/, "").toLowerCase() || "";
  }
}

function isHostnameReservedForPlatform(hostname) {
  const normalizedPlatformApex = String(env.platformApexDomain || "").trim().toLowerCase();

  if (!normalizedPlatformApex) {
    return false;
  }

  return hostname === normalizedPlatformApex || hostname.endsWith(`.${normalizedPlatformApex}`);
}

function isSupportedDevelopmentHostname(hostname) {
  if (env.nodeEnv === "production") {
    return false;
  }

  return hostname === "localhost" || hostname.endsWith(".localhost");
}

function assertValidCustomHostname(value) {
  const hostname = normalizeHostname(value);

  if (!hostname) {
    throw new AppError("Ingresa un dominio valido", 400);
  }

  if (hostname.length > 255) {
    throw new AppError("El dominio supera el largo maximo permitido", 400);
  }

  if (isHostnameReservedForPlatform(hostname)) {
    throw new AppError("Ese dominio pertenece al espacio reservado de la plataforma", 400);
  }

  if (isSupportedDevelopmentHostname(hostname)) {
    return hostname;
  }

  if (!hostname.includes(".")) {
    throw new AppError("El dominio debe incluir al menos un punto", 400);
  }

  const labels = hostname.split(".");

  const hasInvalidLabel = labels.some((label) => {
    if (!label || label.length > 63) {
      return true;
    }

    return !/^[a-z0-9-]+$/i.test(label) || label.startsWith("-") || label.endsWith("-");
  });

  if (hasInvalidLabel) {
    throw new AppError("El dominio contiene caracteres o segmentos invalidos", 400);
  }

  const topLevelDomain = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/i.test(topLevelDomain)) {
    throw new AppError("El dominio debe terminar en una extension valida", 400);
  }

  return hostname;
}

function inferTenantDomainType(hostname) {
  if (isSupportedDevelopmentHostname(hostname)) {
    return TenantDomainType.CUSTOM_SUBDOMAIN;
  }

  const labels = hostname.split(".");
  const lastTwoLabels = labels.slice(-2).join(".");

  if (MULTIPART_PUBLIC_SUFFIXES.has(lastTwoLabels)) {
    return labels.length === 3
      ? TenantDomainType.CUSTOM_ROOT
      : TenantDomainType.CUSTOM_SUBDOMAIN;
  }

  return labels.length === 2
    ? TenantDomainType.CUSTOM_ROOT
    : TenantDomainType.CUSTOM_SUBDOMAIN;
}

function buildDnsSetupForHostname(hostname, type) {
  if (type === TenantDomainType.CUSTOM_ROOT) {
    if (!env.platformDomainARecords.length) {
      return {
        mode: "MANUAL",
        host: hostname,
        values: [],
        summary:
          "La plataforma todavia no tiene definidos los A records esperados para dominios raiz.",
      };
    }

    return {
      mode: "A",
      host: hostname,
      values: env.platformDomainARecords,
      summary: `Apunta ${hostname} a ${env.platformDomainARecords.join(", ")}.`,
    };
  }

  return {
    mode: "CNAME",
    host: hostname,
    values: env.platformDomainCnameTarget ? [env.platformDomainCnameTarget] : [],
    summary: env.platformDomainCnameTarget
      ? `Crea un CNAME para ${hostname} apuntando a ${env.platformDomainCnameTarget}.`
      : "La plataforma todavia no tiene definido el target CNAME esperado.",
  };
}

function serializeTenantDomain(domain) {
  if (!domain) {
    return null;
  }

  return {
    id: domain.id,
    hostname: domain.hostname,
    isPrimary: domain.isPrimary,
    type: domain.type,
    status: domain.status,
    verifiedAt: domain.verifiedAt,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    setup: buildDnsSetupForHostname(domain.hostname, domain.type),
  };
}

async function getTenantDomains(tenant, options = {}) {
  const { dbClient = prisma } = options;
  return dbClient.tenantDomain.findMany({
    where: { tenantId: tenant.id },
    orderBy: [
      { isPrimary: "desc" },
      { type: "asc" },
      { hostname: "asc" },
    ],
  });
}

function buildTenantDomainsOverviewPayload(domains) {
  const serializedDomains = domains.map(serializeTenantDomain);
  const primaryDomain = serializedDomains.find((domain) => domain?.isPrimary) || null;
  const platformDomain =
    serializedDomains.find((domain) => domain?.type === TenantDomainType.PLATFORM_SUBDOMAIN) || null;
  const customDomain =
    serializedDomains.find((domain) => CUSTOM_DOMAIN_TYPES.includes(domain?.type)) || null;

  return {
    platformApexDomain: env.platformApexDomain,
    platformDomainCnameTarget: env.platformDomainCnameTarget || null,
    platformDomainARecords: env.platformDomainARecords,
    sslStrategy: env.platformDomainSslStrategy,
    adminHostname: platformDomain?.hostname || null,
    primaryDomain,
    platformDomain,
    customDomain,
    domains: serializedDomains,
  };
}

async function getTenantDomainsOverview(tenant, options = {}) {
  const domains = await getTenantDomains(tenant, options);
  return buildTenantDomainsOverviewPayload(domains);
}

async function upsertTenantCustomDomain(tenant, hostname) {
  const normalizedHostname = assertValidCustomHostname(hostname);
  const domainType = inferTenantDomainType(normalizedHostname);

  const overview = await prisma.$transaction(async (tx) => {
    const existingByHostname = await tx.tenantDomain.findUnique({
      where: { hostname: normalizedHostname },
    });

    if (existingByHostname && existingByHostname.tenantId !== tenant.id) {
      throw new AppError("Ese dominio ya esta conectado a otro negocio", 409);
    }

    const customDomains = await tx.tenantDomain.findMany({
      where: {
        tenantId: tenant.id,
        type: {
          in: CUSTOM_DOMAIN_TYPES,
        },
      },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    });

    const matchingDomain = customDomains.find((domain) => domain.hostname === normalizedHostname) || null;
    const platformDomain = await tx.tenantDomain.findFirst({
      where: {
        tenantId: tenant.id,
        type: TenantDomainType.PLATFORM_SUBDOMAIN,
      },
      orderBy: [{ isPrimary: "desc" }],
    });

    if (matchingDomain) {
      const duplicateIds = customDomains
        .filter((domain) => domain.id !== matchingDomain.id)
        .map((domain) => domain.id);

      if (duplicateIds.length) {
        await tx.tenantDomain.deleteMany({
          where: {
            id: {
              in: duplicateIds,
            },
          },
        });
      }

      await tx.tenantDomain.update({
        where: { id: matchingDomain.id },
        data: {
          type: domainType,
        },
      });

      return getTenantDomainsOverview(tenant, { dbClient: tx });
    }

    const hadPrimaryCustomDomain = customDomains.some((domain) => domain.isPrimary);

    if (customDomains.length) {
      await tx.tenantDomain.deleteMany({
        where: {
          id: {
            in: customDomains.map((domain) => domain.id),
          },
        },
      });
    }

    if (hadPrimaryCustomDomain && platformDomain) {
      await tx.tenantDomain.update({
        where: { id: platformDomain.id },
        data: {
          isPrimary: true,
        },
      });
    }

    await tx.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        hostname: normalizedHostname,
        isPrimary: false,
        type: domainType,
        status: TenantDomainStatus.PENDING,
        verifiedAt: null,
      },
    });

    return getTenantDomainsOverview(tenant, { dbClient: tx });
  });

  logTenantDomainAudit("custom_domain.upserted", {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    hostname: normalizedHostname,
    type: domainType,
  });

  return overview;
}

async function getOwnedTenantDomainOrThrow(tenant, domainId, options = {}) {
  const { dbClient = prisma } = options;
  const tenantDomain = await dbClient.tenantDomain.findFirst({
    where: {
      id: domainId,
      tenantId: tenant.id,
    },
  });

  if (!tenantDomain) {
    throw new AppError("No encontramos ese dominio dentro del tenant actual", 404);
  }

  return tenantDomain;
}

async function safeResolveCname(hostname) {
  try {
    const result = await dns.resolveCname(hostname);
    return result.map((item) => normalizeHostname(item)).filter(Boolean);
  } catch (error) {
    if (error && ["ENOTFOUND", "ENODATA", "ENOTIMP", "ESERVFAIL", "EREFUSED"].includes(error.code)) {
      return [];
    }

    throw error;
  }
}

async function safeResolveA(hostname) {
  try {
    const result = await dns.resolve4(hostname);
    return result.map((item) => String(item).trim()).filter(Boolean);
  } catch (error) {
    if (error && ["ENOTFOUND", "ENODATA", "ENOTIMP", "ESERVFAIL", "EREFUSED"].includes(error.code)) {
      return [];
    }

    throw error;
  }
}

function buildVerificationFailureMessage(domain) {
  if (domain.type === TenantDomainType.CUSTOM_ROOT) {
    if (!env.platformDomainARecords.length) {
      return "No hay A records configurados en la plataforma para validar dominios raiz.";
    }

    return `El dominio todavia no apunta a ${env.platformDomainARecords.join(", ")}.`;
  }

  if (!env.platformDomainCnameTarget) {
    return "No hay un target CNAME configurado en la plataforma para validar subdominios.";
  }

  return `El dominio todavia no apunta por CNAME a ${env.platformDomainCnameTarget}.`;
}

async function validateTenantDomainDns(domain) {
  const [actualCnameRecords, actualARecords] = await Promise.all([
    safeResolveCname(domain.hostname),
    safeResolveA(domain.hostname),
  ]);

  const expectedSetup = buildDnsSetupForHostname(domain.hostname, domain.type);
  const expectedValues = expectedSetup.values.map((item) => String(item).trim().toLowerCase());

  const matchedByCname =
    expectedSetup.mode === "CNAME" &&
    expectedValues.some((expectedValue) => actualCnameRecords.includes(expectedValue));

  const matchedByA =
    expectedSetup.mode === "A" &&
    expectedValues.length > 0 &&
    expectedValues.every((expectedValue) => actualARecords.includes(expectedValue));

  const fallbackMatchedByA =
    expectedSetup.mode === "CNAME" &&
    env.platformDomainARecords.length > 0 &&
    env.platformDomainARecords.every((expectedValue) => actualARecords.includes(expectedValue));

  const isValid = matchedByCname || matchedByA || fallbackMatchedByA;
  const matchedRecordType = matchedByCname
    ? "CNAME"
    : matchedByA || fallbackMatchedByA
      ? "A"
      : null;

  return {
    hostname: domain.hostname,
    isValid,
    expectedSetup,
    matchedRecordType,
    actualCnameRecords,
    actualARecords,
    sslStrategy: env.platformDomainSslStrategy,
    message: isValid
      ? `DNS validado. El dominio ya puede usarse y el SSL queda a cargo de la infraestructura (${env.platformDomainSslStrategy}).`
      : buildVerificationFailureMessage(domain),
  };
}

async function verifyTenantDomain(tenant, domainId) {
  const tenantDomain = await getOwnedTenantDomainOrThrow(tenant, domainId);

  if (!CUSTOM_DOMAIN_TYPES.includes(tenantDomain.type)) {
    throw new AppError("Solo se puede verificar DNS sobre dominios custom", 400);
  }

  const verification = await validateTenantDomainDns(tenantDomain);

  const updatedDomain = await prisma.tenantDomain.update({
    where: { id: tenantDomain.id },
    data: {
      status: verification.isValid ? TenantDomainStatus.ACTIVE : TenantDomainStatus.FAILED,
      verifiedAt: verification.isValid ? new Date() : null,
    },
  });

  const overview = await getTenantDomainsOverview(tenant);

  logTenantDomainAudit("custom_domain.verified", {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    hostname: tenantDomain.hostname,
    domainId: tenantDomain.id,
    verificationStatus: verification.isValid ? "ACTIVE" : "FAILED",
    matchedRecordType: verification.matchedRecordType,
  });

  return {
    overview,
    verification: {
      ...verification,
      domain: serializeTenantDomain(updatedDomain),
    },
  };
}

async function setPrimaryTenantDomain(tenant, domainId) {
  const overview = await prisma.$transaction(async (tx) => {
    const nextPrimaryDomain = await getOwnedTenantDomainOrThrow(tenant, domainId, { dbClient: tx });

    if (nextPrimaryDomain.status !== TenantDomainStatus.ACTIVE) {
      throw new AppError("Solo un dominio activo puede quedar como principal", 400);
    }

    await tx.tenantDomain.updateMany({
      where: {
        tenantId: tenant.id,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    await tx.tenantDomain.update({
      where: { id: nextPrimaryDomain.id },
      data: {
        isPrimary: true,
      },
    });

    return getTenantDomainsOverview(tenant, { dbClient: tx });
  });

  const primaryDomain = overview.primaryDomain || null;

  logTenantDomainAudit("domain.primary_changed", {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    domainId,
    primaryHostname: primaryDomain?.hostname || null,
    primaryType: primaryDomain?.type || null,
  });

  return overview;
}

module.exports = {
  assertValidCustomHostname,
  getTenantDomainsOverview,
  inferTenantDomainType,
  setPrimaryTenantDomain,
  upsertTenantCustomDomain,
  verifyTenantDomain,
};
