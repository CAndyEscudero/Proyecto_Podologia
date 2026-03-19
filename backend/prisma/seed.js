require("dotenv").config();

const { PrismaClient, UserRole, AvailabilityRuleType } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured in backend/.env");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "Pies Sanos Venado",
      phone: "+54 9 3462 000000",
      address: "Av. Casey 123, Venado Tuerto",
      bookingWindowDays: 45,
      appointmentGapMin: 0,
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
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
      where: { slug: service.slug },
      update: {},
      create: service,
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
        dayOfWeek: rule.dayOfWeek,
        type: rule.type,
        startTime: rule.startTime,
        endTime: rule.endTime,
      },
    });

    if (!existing) {
      await prisma.availabilityRule.create({ data: rule });
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
