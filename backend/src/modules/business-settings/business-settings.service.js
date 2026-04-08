const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { TenantDomainType } = require("@prisma/client");
const { normalizeWhatsAppNumber } = require("../notifications/whatsapp.service");
const { buildPlatformSubdomainHostname } = require("../tenants/tenant-hostnames");
const {
  serializeMercadoPagoConnection,
} = require("../payments/mercadopago-oauth.service");

function buildDefaultBusinessSettingsData(tenant) {
  return {
    tenantId: tenant.id,
    businessName: tenant.name || "Nuevo negocio",
    depositPercentage: 50,
    mercadoPagoEnabled: false,
    transactionalEmailEnabled: false,
    transactionalEmailFromName: tenant.name || "Nuevo negocio",
    transactionalEmailReplyTo: null,
    whatsAppEnabled: false,
    whatsAppNumber: null,
    whatsAppDefaultMessage: null,
  };
}

function sanitizeBusinessSettings(settings, connection = null) {
  const {
    mercadoPagoAccessToken,
    mercadoPagoWebhookSecret,
    ...safeSettings
  } = settings;
  const mercadoPagoConnection = serializeMercadoPagoConnection(connection);
  const hasOauthConnection = mercadoPagoConnection.isConnected;

  return {
    ...safeSettings,
    mercadoPagoPublicKey: connection?.publicKey || safeSettings.mercadoPagoPublicKey || null,
    whatsAppNumber: normalizeWhatsAppNumber(safeSettings.whatsAppNumber || "") || null,
    hasMercadoPagoAccessToken: hasOauthConnection || Boolean(mercadoPagoAccessToken),
    hasMercadoPagoWebhookSecret: hasOauthConnection
      ? Boolean(env.mercadoPagoPlatformWebhookSecret)
      : Boolean(mercadoPagoWebhookSecret),
    mercadoPagoConnection,
    mercadoPagoSetupMode: hasOauthConnection
      ? "OAUTH"
      : mercadoPagoAccessToken
        ? "MANUAL"
        : "NONE",
  };
}

function serializePublicBusinessSettings(settings) {
  const whatsAppNumber = normalizeWhatsAppNumber(settings.whatsAppNumber || "") || null;

  return {
    businessName: settings.businessName,
    contactEmail: settings.contactEmail,
    phone: settings.phone,
    address: settings.address,
    bookingWindowDays: settings.bookingWindowDays,
    depositPercentage: settings.depositPercentage,
    timezone: settings.timezone,
    whatsAppEnabled: Boolean(settings.whatsAppEnabled && whatsAppNumber),
    whatsAppNumber,
    whatsAppDefaultMessage: settings.whatsAppDefaultMessage || null,
  };
}

async function getTenantPublicDomainContext(tenant) {
  const activeDomains = await prisma.tenantDomain.findMany({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  const adminHostname = buildPlatformSubdomainHostname(tenant.slug);
  const primaryDomain = activeDomains.find((domain) => domain.isPrimary) || null;
  const primaryCustomDomain =
    activeDomains.find(
      (domain) =>
        domain.isPrimary &&
        (domain.type === TenantDomainType.CUSTOM_ROOT ||
          domain.type === TenantDomainType.CUSTOM_SUBDOMAIN)
    ) || null;

  return {
    adminHostname,
    currentHostname: tenant.hostname || adminHostname,
    currentDomainType: tenant.domainType || TenantDomainType.PLATFORM_SUBDOMAIN,
    primaryPublicHostname: primaryDomain?.hostname || adminHostname,
    primaryPublicDomainType: primaryDomain?.type || TenantDomainType.PLATFORM_SUBDOMAIN,
    shouldRedirectToPreferredDomain: Boolean(
      primaryCustomDomain &&
        tenant.domainType === TenantDomainType.PLATFORM_SUBDOMAIN &&
        primaryCustomDomain.hostname !== tenant.hostname
    ),
  };
}

function normalizeNullableString(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function buildBusinessSettingsUpdateData(data) {
  const updateData = { ...data };

  if (Object.prototype.hasOwnProperty.call(updateData, "mercadoPagoPublicKey")) {
    updateData.mercadoPagoPublicKey = normalizeNullableString(updateData.mercadoPagoPublicKey);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "mercadoPagoAccessToken")) {
    updateData.mercadoPagoAccessToken = normalizeNullableString(updateData.mercadoPagoAccessToken);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "mercadoPagoWebhookSecret")) {
    updateData.mercadoPagoWebhookSecret = normalizeNullableString(updateData.mercadoPagoWebhookSecret);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "transactionalEmailFromName")) {
    updateData.transactionalEmailFromName = normalizeNullableString(updateData.transactionalEmailFromName);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "transactionalEmailReplyTo")) {
    updateData.transactionalEmailReplyTo = normalizeNullableString(updateData.transactionalEmailReplyTo);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "whatsAppNumber")) {
    updateData.whatsAppNumber = normalizeWhatsAppNumber(updateData.whatsAppNumber || "") || null;
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "whatsAppDefaultMessage")) {
    updateData.whatsAppDefaultMessage = normalizeNullableString(updateData.whatsAppDefaultMessage);
  }

  return updateData;
}

async function getBusinessSettingsRecord(tenant) {
  const existing = await prisma.businessSettings.findUnique({
    where: { tenantId: tenant.id },
  });

  if (existing) {
    return existing;
  }

  return prisma.businessSettings.create({
    data: buildDefaultBusinessSettingsData(tenant),
  });
}

async function getBusinessSettings(tenant) {
  const [settings, connection] = await Promise.all([
    getBusinessSettingsRecord(tenant),
    prisma.mercadoPagoConnection.findUnique({
      where: { tenantId: tenant.id },
    }),
  ]);
  return sanitizeBusinessSettings(settings, connection);
}

async function getPublicBusinessSettings(tenant) {
  const settings = await getBusinessSettingsRecord(tenant);
  const publicSettings = serializePublicBusinessSettings(settings);
  const domainContext = await getTenantPublicDomainContext(tenant);

  return {
    ...publicSettings,
    ...domainContext,
  };
}

async function updateBusinessSettings(tenant, data) {
  const current = await getBusinessSettingsRecord(tenant);
  const updated = await prisma.businessSettings.update({
    where: { id: current.id },
    data: buildBusinessSettingsUpdateData(data),
  });
  const connection = await prisma.mercadoPagoConnection.findUnique({
    where: { tenantId: tenant.id },
  });

  return sanitizeBusinessSettings(updated, connection);
}

module.exports = {
  buildBusinessSettingsUpdateData,
  buildDefaultBusinessSettingsData,
  getBusinessSettings,
  getPublicBusinessSettings,
  updateBusinessSettings,
};
