require("dotenv").config();

const {
  PrismaClient,
  UserRole,
  AvailabilityRuleType,
  TenantStatus,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");
const {
  buildPlatformSubdomainHostname,
  normalizeTenantSlug,
  upsertTenantPlatformDomain,
} = require("../src/modules/tenants/tenant-provisioning.service");
const {
  buildDefaultBusinessSettingsData,
} = require("../src/modules/business-settings/business-settings.service");

const prisma = new PrismaClient();
const DEFAULT_TENANT_SLUG = normalizeTenantSlug("pies-sanos-venado");
const DEFAULT_TENANT_NAME = "Pies Sanos Venado";
const DEFAULT_MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const DEFAULT_MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY || "";
const DEFAULT_MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";
const DEFAULT_TRANSACTIONAL_EMAIL_ENABLED = false;
const DEFAULT_WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || process.env.VITE_WHATSAPP_NUMBER || "5493462000000";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured in backend/.env");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: {
      name: DEFAULT_TENANT_NAME,
      businessType: "PODOLOGY",
      status: TenantStatus.ACTIVE,
    },
    create: {
      name: DEFAULT_TENANT_NAME,
      slug: DEFAULT_TENANT_SLUG,
      businessType: "PODOLOGY",
      status: TenantStatus.ACTIVE,
    },
  });

  await upsertTenantPlatformDomain(prisma, defaultTenant);

  const defaultBusinessSettings = await prisma.businessSettings.upsert({
    where: { tenantId: defaultTenant.id },
    update: {},
    create: {
      ...buildDefaultBusinessSettingsData(defaultTenant),
      phone: "+54 9 3462 000000",
      address: "Av. Casey 123, Venado Tuerto",
      bookingWindowDays: 45,
      appointmentGapMin: 0,
      mercadoPagoEnabled: Boolean(DEFAULT_MP_ACCESS_TOKEN),
      mercadoPagoPublicKey: DEFAULT_MP_PUBLIC_KEY || null,
      mercadoPagoAccessToken: DEFAULT_MP_ACCESS_TOKEN || null,
      mercadoPagoWebhookSecret: DEFAULT_MP_WEBHOOK_SECRET || null,
      transactionalEmailEnabled: DEFAULT_TRANSACTIONAL_EMAIL_ENABLED,
      transactionalEmailFromName: DEFAULT_TENANT_NAME,
      transactionalEmailReplyTo: adminEmail,
      whatsAppEnabled: Boolean(DEFAULT_WHATSAPP_NUMBER),
      whatsAppNumber: DEFAULT_WHATSAPP_NUMBER || null,
      whatsAppDefaultMessage: "Hola, quiero consultar por un turno.",
    },
  });

  if (DEFAULT_MP_ACCESS_TOKEN && !defaultBusinessSettings.mercadoPagoAccessToken) {
    await prisma.businessSettings.update({
      where: { id: defaultBusinessSettings.id },
      data: {
        mercadoPagoEnabled: true,
        mercadoPagoPublicKey: DEFAULT_MP_PUBLIC_KEY || defaultBusinessSettings.mercadoPagoPublicKey,
        mercadoPagoAccessToken: DEFAULT_MP_ACCESS_TOKEN,
        mercadoPagoWebhookSecret: DEFAULT_MP_WEBHOOK_SECRET || defaultBusinessSettings.mercadoPagoWebhookSecret,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      tenantId: defaultTenant.id,
      fullName: "Admin Principal",
      role: UserRole.OWNER,
      isActive: true,
    },
    create: {
      tenantId: defaultTenant.id,
      fullName: "Admin Principal",
      email: adminEmail,
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  const services = [
    {
      name: "Podologia clinica",
      slug: "podologia-clinica",
      description: "Atencion profesional para molestias y cuidado clinico.",
      durationMin: 45,
    },
    {
      name: "Pedicuria estetica",
      slug: "pedicuria-estetica",
      description: "Servicio estetico para mantenimiento y prolijidad.",
      durationMin: 60,
    },
    {
      name: "Esmaltado semipermanente",
      slug: "esmaltado-semipermanente",
      description: "Aplicacion con resultado duradero.",
      durationMin: 30,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: {
        tenantId_slug: {
          tenantId: defaultTenant.id,
          slug: service.slug,
        },
      },
      update: {},
      create: {
        tenantId: defaultTenant.id,
        ...service,
      },
    });
  }

  const rules = [
    { dayOfWeek: 1, type: AvailabilityRuleType.WORKING_HOURS, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 2, type: AvailabilityRuleType.WORKING_HOURS, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 3, type: AvailabilityRuleType.WORKING_HOURS, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 4, type: AvailabilityRuleType.WORKING_HOURS, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 5, type: AvailabilityRuleType.WORKING_HOURS, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 1, type: AvailabilityRuleType.BREAK, startTime: "13:00", endTime: "14:00" },
    { dayOfWeek: 2, type: AvailabilityRuleType.BREAK, startTime: "13:00", endTime: "14:00" },
    { dayOfWeek: 3, type: AvailabilityRuleType.BREAK, startTime: "13:00", endTime: "14:00" },
    { dayOfWeek: 4, type: AvailabilityRuleType.BREAK, startTime: "13:00", endTime: "14:00" },
    { dayOfWeek: 5, type: AvailabilityRuleType.BREAK, startTime: "13:00", endTime: "14:00" },
  ];

  for (const rule of rules) {
    const existing = await prisma.availabilityRule.findFirst({
      where: {
        tenantId: defaultTenant.id,
        dayOfWeek: rule.dayOfWeek,
        type: rule.type,
        startTime: rule.startTime,
        endTime: rule.endTime,
      },
    });

    if (!existing) {
      await prisma.availabilityRule.create({
        data: {
          tenantId: defaultTenant.id,
          ...rule,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
