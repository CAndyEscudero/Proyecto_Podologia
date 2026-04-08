const { prisma } = require("../src/config/prisma");
const { getTenantDomainsOverview } = require("../src/modules/tenant-domains/tenant-domains.service");

function parseArgs(argv) {
  const args = {
    slug: "",
    hostname: "",
    email: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--slug") {
      args.slug = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--hostname") {
      args.hostname = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--email") {
      args.email = argv[index + 1] || "";
      index += 1;
    }
  }

  return args;
}

function buildQueryMode(args) {
  if (args.slug) {
    return { mode: "slug", value: args.slug.trim().toLowerCase() };
  }

  if (args.hostname) {
    return { mode: "hostname", value: args.hostname.trim().toLowerCase() };
  }

  if (args.email) {
    return { mode: "email", value: args.email.trim().toLowerCase() };
  }

  throw new Error("Debes indicar --slug, --hostname o --email");
}

async function findTenant(query) {
  if (query.mode === "slug") {
    return prisma.tenant.findUnique({
      where: { slug: query.value },
      include: {
        businessSettings: true,
        users: {
          orderBy: [{ role: "asc" }, { email: "asc" }],
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            availabilityRules: true,
            blockedDates: true,
            clients: true,
            services: true,
            users: true,
          },
        },
      },
    });
  }

  if (query.mode === "hostname") {
    const domain = await prisma.tenantDomain.findUnique({
      where: { hostname: query.value },
      select: { tenantId: true },
    });

    if (!domain) {
      return null;
    }

    return findTenant({ mode: "tenantId", value: domain.tenantId });
  }

  if (query.mode === "email") {
    const user = await prisma.user.findUnique({
      where: { email: query.value },
      select: { tenantId: true },
    });

    if (!user) {
      return null;
    }

    return findTenant({ mode: "tenantId", value: user.tenantId });
  }

  return prisma.tenant.findUnique({
    where: { id: query.value },
    include: {
      businessSettings: true,
      users: {
        orderBy: [{ role: "asc" }, { email: "asc" }],
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          appointments: true,
          availabilityRules: true,
          blockedDates: true,
          clients: true,
          services: true,
          users: true,
        },
      },
    },
  });
}

function buildSettingsSummary(settings) {
  if (!settings) {
    return null;
  }

  return {
    businessName: settings.businessName,
    contactEmail: settings.contactEmail,
    phone: settings.phone,
    address: settings.address,
    timezone: settings.timezone,
    bookingWindowDays: settings.bookingWindowDays,
    appointmentGapMin: settings.appointmentGapMin,
    depositPercentage: settings.depositPercentage,
    integrations: {
      mercadoPagoEnabled: settings.mercadoPagoEnabled,
      mercadoPagoConfigured:
        Boolean(settings.mercadoPagoPublicKey) && Boolean(settings.mercadoPagoAccessToken),
      transactionalEmailEnabled: settings.transactionalEmailEnabled,
      transactionalEmailConfigured: Boolean(settings.transactionalEmailFromName),
      whatsAppEnabled: settings.whatsAppEnabled,
      whatsAppConfigured: Boolean(settings.whatsAppNumber),
    },
  };
}

function buildTenantSummary(tenant, domainsOverview) {
  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      businessType: tenant.businessType,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    },
    domains: {
      adminHostname: domainsOverview.adminHostname,
      primaryDomain: domainsOverview.primaryDomain,
      customDomain: domainsOverview.customDomain,
      platformDomain: domainsOverview.platformDomain,
      sslStrategy: domainsOverview.sslStrategy,
      platformApexDomain: domainsOverview.platformApexDomain,
      platformDomainCnameTarget: domainsOverview.platformDomainCnameTarget,
      platformDomainARecords: domainsOverview.platformDomainARecords,
      all: domainsOverview.domains,
    },
    settings: buildSettingsSummary(tenant.businessSettings),
    counts: tenant._count,
    users: tenant.users,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const query = buildQueryMode(args);
  const tenant = await findTenant(query);

  if (!tenant) {
    throw new Error("No encontramos un tenant con ese criterio");
  }

  const domainsOverview = await getTenantDomainsOverview(tenant);
  console.log(JSON.stringify(buildTenantSummary(tenant, domainsOverview), null, 2));
}

main()
  .catch((error) => {
    console.error("[tenant:inspect] Error");
    console.error(error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
