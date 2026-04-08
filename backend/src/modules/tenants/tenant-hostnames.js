const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");

const MAX_TENANT_SLUG_LENGTH = 48;

function normalizeTenantSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_TENANT_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
}

function getPlatformHostnameSuffix() {
  const suffix = String(env.platformApexDomain || "").trim().toLowerCase();

  if (!suffix) {
    throw new AppError("PLATFORM_APEX_DOMAIN no esta configurado", 500);
  }

  return suffix.replace(/\.$/, "");
}

function buildPlatformSubdomainHostname(slug) {
  const normalizedSlug = normalizeTenantSlug(slug);

  if (!normalizedSlug) {
    throw new AppError("Slug de tenant invalido", 400);
  }

  return `${normalizedSlug}.${getPlatformHostnameSuffix()}`;
}

module.exports = {
  buildPlatformSubdomainHostname,
  MAX_TENANT_SLUG_LENGTH,
  normalizeTenantSlug,
};
