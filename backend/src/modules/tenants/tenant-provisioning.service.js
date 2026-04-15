const {
  TenantDomainStatus,
  TenantDomainType,
  TenantStatus,
} = require("@prisma/client");
const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const {
  buildDefaultBusinessSettingsData,
} = require("../business-settings/business-settings.service");
const {
  buildPlatformSubdomainHostname,
  MAX_TENANT_SLUG_LENGTH,
  normalizeTenantSlug,
} = require("./tenant-hostnames");
const RESERVED_TENANT_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "blog",
  "demo",
  "domains",
  "docs",
  "help",
  "mail",
  "root",
  "static",
  "status",
  "support",
  "www",
]);

function assertValidTenantSlug(slug) {
  const normalizedSlug = normalizeTenantSlug(slug);

  if (!normalizedSlug) {
    throw new AppError("No se pudo generar un slug valido para el tenant", 400);
  }

  if (normalizedSlug.length < 3) {
    throw new AppError("El slug del tenant debe tener al menos 3 caracteres", 400);
  }

  if (RESERVED_TENANT_SLUGS.has(normalizedSlug)) {
    throw new AppError("El slug elegido esta reservado para la plataforma", 400);
  }

  return normalizedSlug;
}

function buildSlugCandidate(baseSlug, suffixNumber) {
  if (!suffixNumber || suffixNumber <= 1) {
    return baseSlug;
  }

  const suffix = `-${suffixNumber}`;
  const trimmedBase = baseSlug.slice(0, Math.max(MAX_TENANT_SLUG_LENGTH - suffix.length, 1));
  return `${trimmedBase}${suffix}`;
}

async function hasTenantSlugCollision(dbClient, slug, ignoredTenantId = null) {
  const existingTenant = await dbClient.tenant.findFirst({
    where: {
      slug,
      ...(ignoredTenantId ? { id: { not: ignoredTenantId } } : {}),
    },
    select: { id: true },
  });

  if (existingTenant) {
    return true;
  }

  const existingDomain = await dbClient.tenantDomain.findFirst({
    where: {
      hostname: buildPlatformSubdomainHostname(slug),
      ...(ignoredTenantId ? { tenantId: { not: ignoredTenantId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existingDomain);
}

async function generateAvailableTenantSlug(value, options = {}) {
  const { dbClient = prisma, ignoredTenantId = null } = options;
  const normalizedBaseSlug = assertValidTenantSlug(value);
  let suffixNumber = 1;

  while (suffixNumber < 500) {
    const candidate = buildSlugCandidate(normalizedBaseSlug, suffixNumber);
    const hasCollision = await hasTenantSlugCollision(dbClient, candidate, ignoredTenantId);

    if (!hasCollision) {
      return candidate;
    }

    suffixNumber += 1;
  }

  throw new AppError("No se pudo generar un slug disponible para el tenant", 409);
}

function buildPlatformDomainData(tenant, domainStatus = null) {
  const normalizedStatus =
    domainStatus || (tenant.status === TenantStatus.ACTIVE ? TenantDomainStatus.ACTIVE : TenantDomainStatus.PENDING);

  return {
    tenantId: tenant.id,
    hostname: buildPlatformSubdomainHostname(tenant.slug),
    isPrimary: true,
    type: TenantDomainType.PLATFORM_SUBDOMAIN,
    status: normalizedStatus,
    verifiedAt: normalizedStatus === TenantDomainStatus.ACTIVE ? new Date() : null,
  };
}

async function upsertTenantPlatformDomain(dbClient, tenant, domainStatus = null) {
  const domainData = buildPlatformDomainData(tenant, domainStatus);

  return dbClient.tenantDomain.upsert({
    where: { hostname: domainData.hostname },
    update: domainData,
    create: domainData,
  });
}

async function createTenantWithPlatformDomain(input, options = {}) {
  const { dbClient = prisma } = options;
  const tenantName = String(input?.name || "").trim();

  if (!tenantName) {
    throw new AppError("El tenant debe tener un nombre comercial", 400);
  }

  const tenantStatus = input?.status || TenantStatus.PENDING;
  const tenantSlug = await generateAvailableTenantSlug(input?.requestedSlug || tenantName, { dbClient });

  return dbClient.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        businessType: input?.businessType || null,
        status: tenantStatus,
      },
    });

    const domain = await upsertTenantPlatformDomain(tx, tenant);
    const businessSettings = await tx.businessSettings.create({
      data: buildDefaultBusinessSettingsData(tenant),
    });

    return {
      tenant,
      domain,
      businessSettings,
    };
  });
}

module.exports = {
  RESERVED_TENANT_SLUGS,
  assertValidTenantSlug,
  buildPlatformSubdomainHostname,
  createTenantWithPlatformDomain,
  generateAvailableTenantSlug,
  normalizeTenantSlug,
  upsertTenantPlatformDomain,
};
