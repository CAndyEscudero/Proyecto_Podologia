const bcrypt = require("bcryptjs");
const { z } = require("zod");
const {
  TenantDomainStatus,
  TenantDomainType,
  TenantStatus,
  UserRole,
} = require("@prisma/client");
const { prisma } = require("../../config/prisma");
const { AppError } = require("../../utils/app-error");
const {
  buildBusinessSettingsUpdateData,
  buildDefaultBusinessSettingsData,
} = require("../business-settings/business-settings.service");
const {
  assertValidTenantSlug,
  generateAvailableTenantSlug,
} = require("./tenant-provisioning.service");
const { buildPlatformSubdomainHostname, normalizeTenantSlug } = require("./tenant-hostnames");
const {
  assertValidCustomHostname,
  inferTenantDomainType,
} = require("../tenant-domains/tenant-domains.service");
const {
  buildAvailabilityTemplateRules,
  buildServiceTemplateItems,
} = require("./tenant-onboarding.templates");
const { logTenantOnboardingAudit } = require("./tenant-onboarding.audit");

const timeRegex = /^\d{2}:\d{2}$/;

const onboardingInputSchema = z.object({
  tenant: z.object({
    name: z.string().trim().min(3).max(120),
    requestedSlug: z.string().trim().min(3).max(80).optional(),
    businessType: z.string().trim().max(50).optional().nullable(),
    status: z.nativeEnum(TenantStatus).optional(),
  }),
  owner: z.object({
    fullName: z.string().trim().min(3).max(120),
    email: z.string().trim().email(),
    password: z.string().min(8).max(72),
  }),
  settings: z.object({
    businessName: z.string().trim().min(3).max(120).optional(),
    contactEmail: z.string().trim().email().optional().nullable(),
    phone: z.string().trim().min(8).max(20).optional().nullable(),
    address: z.string().trim().min(5).max(180).optional().nullable(),
    appointmentGapMin: z.number().int().min(0).max(120).optional(),
    bookingWindowDays: z.number().int().min(1).max(365).optional(),
    depositPercentage: z.number().int().min(1).max(100).optional(),
    mercadoPagoEnabled: z.boolean().optional(),
    mercadoPagoPublicKey: z.string().trim().max(255).optional().nullable(),
    mercadoPagoAccessToken: z.string().trim().max(4096).optional().nullable(),
    mercadoPagoWebhookSecret: z.string().trim().max(4096).optional().nullable(),
    transactionalEmailEnabled: z.boolean().optional(),
    transactionalEmailFromName: z.string().trim().max(120).optional().nullable(),
    transactionalEmailReplyTo: z.string().trim().email().optional().nullable(),
    whatsAppEnabled: z.boolean().optional(),
    whatsAppNumber: z.string().trim().max(30).optional().nullable(),
    whatsAppDefaultMessage: z.string().trim().max(500).optional().nullable(),
    timezone: z.string().trim().min(3).max(80).optional(),
  }).optional(),
  services: z.object({
    mode: z.enum(["template", "custom", "none"]).optional(),
    templateKey: z.string().trim().max(80).optional(),
    items: z.array(
      z.object({
        name: z.string().trim().min(3).max(80),
        slug: z.string().trim().min(3).max(80).optional(),
        description: z.string().trim().min(10).max(800),
        durationMin: z.number().int().min(15).max(720),
        priceCents: z.number().int().min(0).max(100000000).optional().nullable(),
        isActive: z.boolean().optional(),
      })
    ).optional(),
  }).optional(),
  availability: z.object({
    mode: z.enum(["template", "custom", "none"]).optional(),
    templateKey: z.string().trim().max(80).optional(),
    rules: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        type: z.enum(["WORKING_HOURS", "BREAK"]),
        startTime: z.string().regex(timeRegex, "Hora invalida"),
        endTime: z.string().regex(timeRegex, "Hora invalida"),
        isActive: z.boolean().optional(),
      }).refine((value) => value.startTime < value.endTime, {
        message: "El rango horario es invalido",
      })
    ).optional(),
  }).optional(),
  domains: z.object({
    customDomain: z.string().trim().max(255).optional().nullable(),
  }).optional(),
});

function buildServiceSlug(value, index = 0) {
  const normalizedBase = normalizeTenantSlug(value).slice(0, 72) || "servicio";
  return index > 0 ? `${normalizedBase}-${index + 1}` : normalizedBase;
}

function normalizeCustomServiceItems(items = []) {
  const slugRegistry = new Set();

  return items.map((item, index) => {
    const baseSlugSource = item.slug || item.name;
    const baseSlug = buildServiceSlug(baseSlugSource, 0);
    let nextIndex = 0;
    let slug = baseSlug;

    while (slugRegistry.has(slug)) {
      nextIndex += 1;
      slug = buildServiceSlug(baseSlug, nextIndex);
    }

    slugRegistry.add(slug);

    return {
      name: item.name.trim(),
      slug,
      description: item.description.trim(),
      durationMin: item.durationMin,
      priceCents: item.priceCents ?? null,
      isActive: item.isActive !== false,
    };
  });
}

function normalizeAvailabilityRules(rules = []) {
  return rules.map((rule) => ({
    dayOfWeek: rule.dayOfWeek,
    type: rule.type,
    startTime: rule.startTime,
    endTime: rule.endTime,
    isActive: rule.isActive !== false,
  }));
}

function resolveInitialServices(payload) {
  const servicesMode = payload.services?.mode || "template";

  if (servicesMode === "none") {
    return [];
  }

  if (servicesMode === "custom") {
    return normalizeCustomServiceItems(payload.services?.items || []);
  }

  return normalizeCustomServiceItems(
    buildServiceTemplateItems(payload.services?.templateKey, payload.tenant.businessType)
  );
}

function resolveInitialAvailability(payload) {
  const availabilityMode = payload.availability?.mode || "template";

  if (availabilityMode === "none") {
    return [];
  }

  if (availabilityMode === "custom") {
    return normalizeAvailabilityRules(payload.availability?.rules || []);
  }

  return normalizeAvailabilityRules(
    buildAvailabilityTemplateRules(payload.availability?.templateKey || "WEEKDAYS_9_TO_18")
  );
}

async function validateTenantOnboardingInput(input, options = {}) {
  const { checkUniqueness = true } = options;
  const payload = onboardingInputSchema.parse(input);
  const requestedSlug = payload.tenant.requestedSlug
    ? assertValidTenantSlug(payload.tenant.requestedSlug)
    : null;
  const tenantStatus = payload.tenant.status || TenantStatus.ACTIVE;
  const tenantSlug = checkUniqueness
    ? await generateAvailableTenantSlug(requestedSlug || payload.tenant.name)
    : requestedSlug || assertValidTenantSlug(payload.tenant.name);
  const customDomain = payload.domains?.customDomain
    ? assertValidCustomHostname(payload.domains.customDomain)
    : null;
  const serviceItems = resolveInitialServices(payload);
  const availabilityRules = resolveInitialAvailability(payload);

  return {
    tenant: {
      name: payload.tenant.name.trim(),
      slug: tenantSlug,
      businessType: payload.tenant.businessType?.trim() || null,
      status: tenantStatus,
    },
    owner: {
      fullName: payload.owner.fullName.trim(),
      email: payload.owner.email.trim().toLowerCase(),
      password: payload.owner.password,
    },
    settings: buildBusinessSettingsUpdateData({
      businessName: payload.settings?.businessName || payload.tenant.name,
      contactEmail: payload.settings?.contactEmail,
      phone: payload.settings?.phone,
      address: payload.settings?.address,
      appointmentGapMin: payload.settings?.appointmentGapMin,
      bookingWindowDays: payload.settings?.bookingWindowDays,
      depositPercentage: payload.settings?.depositPercentage,
      mercadoPagoEnabled: payload.settings?.mercadoPagoEnabled,
      mercadoPagoPublicKey: payload.settings?.mercadoPagoPublicKey,
      mercadoPagoAccessToken: payload.settings?.mercadoPagoAccessToken,
      mercadoPagoWebhookSecret: payload.settings?.mercadoPagoWebhookSecret,
      transactionalEmailEnabled: payload.settings?.transactionalEmailEnabled,
      transactionalEmailFromName:
        payload.settings?.transactionalEmailFromName || payload.tenant.name,
      transactionalEmailReplyTo: payload.settings?.transactionalEmailReplyTo,
      whatsAppEnabled: payload.settings?.whatsAppEnabled,
      whatsAppNumber: payload.settings?.whatsAppNumber,
      whatsAppDefaultMessage: payload.settings?.whatsAppDefaultMessage,
      timezone: payload.settings?.timezone,
    }),
    serviceItems,
    availabilityRules,
    customDomain,
  };
}

async function ensureOwnerEmailAvailable(email, dbClient) {
  const existingUser = await dbClient.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Ya existe un usuario con ese email", 409);
  }
}

async function ensureCustomDomainAvailable(hostname, dbClient) {
  if (!hostname) {
    return;
  }

  const existingDomain = await dbClient.tenantDomain.findUnique({
    where: { hostname },
    select: { id: true },
  });

  if (existingDomain) {
    throw new AppError("El dominio custom ya esta conectado a otro tenant", 409);
  }
}

async function onboardTenant(input) {
  const payload = await validateTenantOnboardingInput(input);

  logTenantOnboardingAudit("tenant.onboarding.started", {
    tenantSlug: payload.tenant.slug,
    ownerEmail: payload.owner.email,
    requestedCustomDomain: payload.customDomain,
  });

  const result = await prisma.$transaction(async (tx) => {
    await ensureOwnerEmailAvailable(payload.owner.email, tx);
    await ensureCustomDomainAvailable(payload.customDomain, tx);

    const tenant = await tx.tenant.create({
      data: {
        name: payload.tenant.name,
        slug: payload.tenant.slug,
        businessType: payload.tenant.businessType,
        status: payload.tenant.status,
      },
    });

    const adminHostname = buildPlatformSubdomainHostname(tenant.slug);

    await tx.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        hostname: adminHostname,
        isPrimary: true,
        type: TenantDomainType.PLATFORM_SUBDOMAIN,
        status:
          tenant.status === TenantStatus.ACTIVE
            ? TenantDomainStatus.ACTIVE
            : TenantDomainStatus.PENDING,
        verifiedAt: tenant.status === TenantStatus.ACTIVE ? new Date() : null,
      },
    });

    const defaultSettings = buildDefaultBusinessSettingsData(tenant);
    await tx.businessSettings.create({
      data: {
        ...defaultSettings,
        ...payload.settings,
      },
    });

    const passwordHash = await bcrypt.hash(payload.owner.password, 10);
    const owner = await tx.user.create({
      data: {
        tenantId: tenant.id,
        fullName: payload.owner.fullName,
        email: payload.owner.email,
        passwordHash,
        role: UserRole.OWNER,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (payload.serviceItems.length) {
      await tx.service.createMany({
        data: payload.serviceItems.map((service) => ({
          tenantId: tenant.id,
          ...service,
        })),
      });
    }

    if (payload.availabilityRules.length) {
      await tx.availabilityRule.createMany({
        data: payload.availabilityRules.map((rule) => ({
          tenantId: tenant.id,
          ...rule,
        })),
      });
    }

    let customDomain = null;
    if (payload.customDomain) {
      customDomain = await tx.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          hostname: payload.customDomain,
          isPrimary: false,
          type: inferTenantDomainType(payload.customDomain),
          status: TenantDomainStatus.PENDING,
          verifiedAt: null,
        },
      });
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        status: tenant.status,
      },
      owner,
      domains: {
        adminHostname,
        customDomain: customDomain
          ? {
              hostname: customDomain.hostname,
              status: customDomain.status,
              type: customDomain.type,
            }
          : null,
      },
      summary: {
        servicesCreated: payload.serviceItems.length,
        availabilityRulesCreated: payload.availabilityRules.length,
      },
    };
  });

  logTenantOnboardingAudit("tenant.onboarding.completed", {
    tenantId: result.tenant.id,
    tenantSlug: result.tenant.slug,
    ownerEmail: result.owner.email,
    adminHostname: result.domains.adminHostname,
    customDomain: result.domains.customDomain?.hostname || null,
    servicesCreated: result.summary.servicesCreated,
    availabilityRulesCreated: result.summary.availabilityRulesCreated,
  });

  return result;
}

module.exports = {
  onboardTenant,
  validateTenantOnboardingInput,
};
