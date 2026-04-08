const { prisma } = require("../../config/prisma");

function normalizeWhatsAppNumber(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[^\d]/g, "");
  return normalized || null;
}

function buildWhatsAppUrl(number, message) {
  const normalizedNumber = normalizeWhatsAppNumber(number);

  if (!normalizedNumber) {
    return null;
  }

  const url = new URL(`https://wa.me/${normalizedNumber}`);

  if (message) {
    url.searchParams.set("text", message);
  }

  return url.toString();
}

async function getTenantWhatsAppConfig(tenantId) {
  const settings = await prisma.businessSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    return null;
  }

  const normalizedNumber = normalizeWhatsAppNumber(settings.whatsAppNumber || "");

  return {
    enabled: Boolean(settings.whatsAppEnabled && normalizedNumber),
    number: normalizedNumber,
    defaultMessage: settings.whatsAppDefaultMessage || null,
    url: buildWhatsAppUrl(normalizedNumber, settings.whatsAppDefaultMessage || null),
  };
}

module.exports = {
  buildWhatsAppUrl,
  getTenantWhatsAppConfig,
  normalizeWhatsAppNumber,
};
