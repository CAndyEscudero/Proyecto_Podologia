const { normalizeTenantSlug } = require("./tenant-hostnames");

const SERVICE_TEMPLATE_LIBRARY = {
  GENERIC_BASIC: [
    {
      name: "Sesion inicial",
      description: "Primera atencion para conocer al cliente, relevar necesidades y definir el servicio adecuado.",
      durationMin: 60,
      priceCents: 22000,
    },
    {
      name: "Control",
      description: "Espacio de seguimiento y ajuste para clientes recurrentes dentro de la agenda habitual.",
      durationMin: 30,
      priceCents: 15000,
    },
  ],
  PODOLOGY_BASIC: [
    {
      name: "Consulta podologica",
      description: "Evaluacion inicial del paciente con diagnostico operativo y plan de trabajo sugerido.",
      durationMin: 45,
      priceCents: 20000,
    },
    {
      name: "Control podologico",
      description: "Seguimiento periodico del tratamiento con enfoque preventivo y correctivo.",
      durationMin: 30,
      priceCents: 15000,
    },
    {
      name: "Tratamiento de unas",
      description: "Atencion integral para molestias frecuentes, cuidado preventivo y correccion localizada.",
      durationMin: 60,
      priceCents: 26000,
    },
  ],
  HAIR_BASIC: [
    {
      name: "Corte",
      description: "Servicio de corte con terminacion prolija, lavado opcional y asesoria segun estilo.",
      durationMin: 45,
      priceCents: 18000,
    },
    {
      name: "Color",
      description: "Aplicacion de coloracion con tiempo de proceso, control y terminacion profesional.",
      durationMin: 120,
      priceCents: 45000,
    },
    {
      name: "Brushing",
      description: "Peinado con brushing para dejar una terminacion lista para evento o salida diaria.",
      durationMin: 30,
      priceCents: 14000,
    },
  ],
  NAILS_BASIC: [
    {
      name: "Semipermanente",
      description: "Manicuria con esmalte semipermanente, preparacion de la una y terminacion durable.",
      durationMin: 60,
      priceCents: 18000,
    },
    {
      name: "Kapping",
      description: "Refuerzo de la una natural con acabado prolijo y mantenimiento pensado para agenda recurrente.",
      durationMin: 90,
      priceCents: 26000,
    },
    {
      name: "Esculpidas",
      description: "Construccion completa de unas esculpidas con tiempo extendido de trabajo y detalle.",
      durationMin: 120,
      priceCents: 36000,
    },
  ],
};

const BUSINESS_TYPE_SERVICE_TEMPLATE = {
  PODOLOGY: "PODOLOGY_BASIC",
  HAIR: "HAIR_BASIC",
  NAILS: "NAILS_BASIC",
};

const AVAILABILITY_TEMPLATE_LIBRARY = {
  WEEKDAYS_9_TO_18: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    type: "WORKING_HOURS",
    startTime: "09:00",
    endTime: "18:00",
    isActive: true,
  })),
  WEEKDAYS_10_TO_19: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    type: "WORKING_HOURS",
    startTime: "10:00",
    endTime: "19:00",
    isActive: true,
  })),
  TUESDAY_TO_SATURDAY_10_TO_19: [2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    type: "WORKING_HOURS",
    startTime: "10:00",
    endTime: "19:00",
    isActive: true,
  })),
};

function ensureServiceSlug(value) {
  return normalizeTenantSlug(value).slice(0, 80) || "servicio";
}

function mapTemplateServiceItem(item, index) {
  return {
    ...item,
    slug: ensureServiceSlug(item.slug || item.name),
    isActive: item.isActive !== false,
  };
}

function buildServiceTemplateItems(templateKey, businessType = null) {
  const resolvedTemplateKey =
    templateKey || BUSINESS_TYPE_SERVICE_TEMPLATE[String(businessType || "").trim().toUpperCase()] || "GENERIC_BASIC";
  const items = SERVICE_TEMPLATE_LIBRARY[resolvedTemplateKey];

  if (!items) {
    throw new Error(`Plantilla de servicios no soportada: ${resolvedTemplateKey}`);
  }

  return items.map(mapTemplateServiceItem);
}

function buildAvailabilityTemplateRules(templateKey = "WEEKDAYS_9_TO_18") {
  const rules = AVAILABILITY_TEMPLATE_LIBRARY[templateKey];

  if (!rules) {
    throw new Error(`Plantilla de horarios no soportada: ${templateKey}`);
  }

  return rules.map((rule) => ({ ...rule }));
}

module.exports = {
  buildAvailabilityTemplateRules,
  buildServiceTemplateItems,
};
