const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET ||= "test-secret";

const { prisma } = require("../src/config/prisma");
const availabilityService = require("../src/modules/availability/availability.service");
const clientsService = require("../src/modules/clients/clients.service");
const paymentsService = require("../src/modules/payments/payments.service");
const emailService = require("../src/modules/notifications/email.service");

const APPOINTMENTS_SERVICE_PATH = "../src/modules/appointments/appointments.service";

const originalAvailabilityFns = {
  getAvailabilityContext: availabilityService.getAvailabilityContext,
  getAvailableSlots: availabilityService.getAvailableSlots,
};
const originalClientFns = {
  upsertClientByEmailOrPhone: clientsService.upsertClientByEmailOrPhone,
};
const originalPaymentFns = {
  createMercadoPagoPreference: paymentsService.createMercadoPagoPreference,
};
const originalEmailFns = {
  sendPendingPaymentReservationEmail: emailService.sendPendingPaymentReservationEmail,
};
const originalAppointmentCreate = prisma.appointment.create;
const originalAppointmentFindFirst = prisma.appointment.findFirst;

function loadAppointmentsServiceWithStubs({
  getAvailabilityContext,
  getAvailableSlots,
  upsertClientByEmailOrPhone,
  createMercadoPagoPreference,
  sendPendingPaymentReservationEmail,
}) {
  availabilityService.getAvailabilityContext = getAvailabilityContext;
  availabilityService.getAvailableSlots = getAvailableSlots;
  clientsService.upsertClientByEmailOrPhone = upsertClientByEmailOrPhone;
  paymentsService.createMercadoPagoPreference = createMercadoPagoPreference;
  emailService.sendPendingPaymentReservationEmail = sendPendingPaymentReservationEmail;

  delete require.cache[require.resolve(APPOINTMENTS_SERVICE_PATH)];
  return require(APPOINTMENTS_SERVICE_PATH);
}

test.afterEach(() => {
  availabilityService.getAvailabilityContext = originalAvailabilityFns.getAvailabilityContext;
  availabilityService.getAvailableSlots = originalAvailabilityFns.getAvailableSlots;
  clientsService.upsertClientByEmailOrPhone = originalClientFns.upsertClientByEmailOrPhone;
  paymentsService.createMercadoPagoPreference = originalPaymentFns.createMercadoPagoPreference;
  emailService.sendPendingPaymentReservationEmail = originalEmailFns.sendPendingPaymentReservationEmail;
  prisma.appointment.create = originalAppointmentCreate;
  prisma.appointment.findFirst = originalAppointmentFindFirst;
  delete require.cache[require.resolve(APPOINTMENTS_SERVICE_PATH)];
});

test("createAppointment reserva dentro del tenant correcto y persiste tenantId", async () => {
  const tenantId = 501;
  const observed = {
    availability: [],
    clientTenantId: null,
    appointmentData: null,
  };

  const appointmentsService = loadAppointmentsServiceWithStubs({
    getAvailabilityContext: async (...args) => {
      observed.availability.push({ source: "context", args });
      return {
        normalizedDate: "2099-05-20",
        service: {
          id: 30,
          name: "Corte",
          durationMin: 45,
        },
        settings: {
          appointmentGapMin: 15,
        },
        appointments: [],
      };
    },
    getAvailableSlots: async (...args) => {
      observed.availability.push({ source: "slots", args });
      return {
        slots: [
          {
            startTime: "10:00",
            endTime: "11:00",
          },
        ],
      };
    },
    upsertClientByEmailOrPhone: async (receivedTenantId, payload) => {
      observed.clientTenantId = receivedTenantId;
      return {
        id: 901,
        ...payload,
      };
    },
    createMercadoPagoPreference: async () => {
      throw new Error("No deberia invocarse para createAppointment");
    },
    sendPendingPaymentReservationEmail: async () => ({ skipped: true }),
  });

  prisma.appointment.create = async ({ data }) => {
    observed.appointmentData = data;
    return {
      id: 1001,
      ...data,
      date: new Date("2099-05-20T00:00:00.000Z"),
      client: {
        id: 901,
        firstName: "Ana",
        lastName: "Perez",
      },
      service: {
        id: 30,
        name: "Corte",
        durationMin: 45,
      },
    };
  };

  const result = await appointmentsService.createAppointment(tenantId, {
    serviceId: 30,
    date: "2099-05-20",
    startTime: "10:00",
    client: {
      firstName: "Ana",
      lastName: "Perez",
      phone: "3462123456",
      email: "ana@mail.com",
      notes: "Prefiere mañana",
    },
  });

  assert.deepEqual(observed.availability, [
    {
      source: "context",
      args: [tenantId, 30, "2099-05-20"],
    },
    {
      source: "slots",
      args: [tenantId, 30, "2099-05-20"],
    },
  ]);
  assert.equal(observed.clientTenantId, tenantId);
  assert.equal(observed.appointmentData.tenantId, tenantId);
  assert.equal(observed.appointmentData.clientId, 901);
  assert.equal(observed.appointmentData.serviceId, 30);
  assert.equal(observed.appointmentData.endTime, "11:00");
  assert.equal(result.appointment.date, "2099-05-20");
});

test("createPaymentReservation usa configuracion del tenant para crear reserva y pago", async () => {
  const tenantId = 777;
  const observed = {
    availability: [],
    clientTenantId: null,
    appointmentCreateData: null,
    paymentPayload: null,
    emailPayload: null,
    refreshedQuery: null,
  };

  const appointmentsService = loadAppointmentsServiceWithStubs({
    getAvailabilityContext: async (...args) => {
      observed.availability.push({ source: "context", args });
      return {
        normalizedDate: "2099-06-10",
        service: {
          id: 44,
          name: "Color",
          durationMin: 60,
          priceCents: 10000,
        },
        settings: {
          appointmentGapMin: 0,
          depositPercentage: 30,
        },
        appointments: [],
      };
    },
    getAvailableSlots: async (...args) => {
      observed.availability.push({ source: "slots", args });
      return {
        slots: [
          {
            startTime: "14:00",
            endTime: "15:00",
          },
        ],
      };
    },
    upsertClientByEmailOrPhone: async (receivedTenantId, payload) => {
      observed.clientTenantId = receivedTenantId;
      return {
        id: 333,
        ...payload,
      };
    },
    createMercadoPagoPreference: async (payload) => {
      observed.paymentPayload = payload;
      return {
        preferenceId: "pref-123",
        checkoutUrl: "https://mp.test/checkout",
      };
    },
    sendPendingPaymentReservationEmail: async (payload) => {
      observed.emailPayload = payload;
      return { skipped: false };
    },
  });

  prisma.appointment.create = async ({ data }) => {
    observed.appointmentCreateData = data;
    return {
      id: 2002,
      ...data,
      date: new Date("2099-06-10T00:00:00.000Z"),
      client: {
        id: 333,
        firstName: "Luz",
        lastName: "Diaz",
        email: "luz@mail.com",
      },
      service: {
        id: 44,
        name: "Color",
        durationMin: 60,
        priceCents: 10000,
      },
    };
  };

  prisma.appointment.findFirst = async (args) => {
    observed.refreshedQuery = args;
    return {
      id: 2002,
      tenantId,
      clientId: 333,
      serviceId: 44,
      date: new Date("2099-06-10T00:00:00.000Z"),
      startTime: "14:00",
      endTime: "15:00",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentOption: "DEPOSIT",
      paymentProvider: "mercado_pago",
      priceCents: 10000,
      depositCents: 3000,
      paymentExpiresAt: new Date("2099-06-10T14:15:00.000Z"),
      client: {
        id: 333,
        firstName: "Luz",
        lastName: "Diaz",
        email: "luz@mail.com",
      },
      service: {
        id: 44,
        name: "Color",
        durationMin: 60,
        priceCents: 10000,
      },
    };
  };

  const result = await appointmentsService.createPaymentReservation(tenantId, {
    serviceId: 44,
    date: "2099-06-10",
    startTime: "14:00",
    client: {
      firstName: "Luz",
      lastName: "Diaz",
      phone: "3462555888",
      email: "luz@mail.com",
      notes: "Confirma por mail",
    },
  });

  assert.deepEqual(observed.availability, [
    {
      source: "context",
      args: [tenantId, 44, "2099-06-10"],
    },
    {
      source: "slots",
      args: [tenantId, 44, "2099-06-10"],
    },
  ]);
  assert.equal(observed.clientTenantId, tenantId);
  assert.equal(observed.appointmentCreateData.tenantId, tenantId);
  assert.equal(observed.appointmentCreateData.depositCents, 3000);
  assert.equal(observed.appointmentCreateData.paymentProvider, "mercado_pago");
  assert.equal(observed.paymentPayload.appointment.tenantId, tenantId);
  assert.deepEqual(observed.refreshedQuery.where, {
    id: 2002,
    tenantId,
  });
  assert.deepEqual(observed.emailPayload, {
    tenantId,
    appointmentId: 2002,
    checkoutUrl: "https://mp.test/checkout",
  });
  assert.equal(result.paymentSummary.depositCents, 3000);
  assert.equal(result.checkoutUrl, "https://mp.test/checkout");
});
