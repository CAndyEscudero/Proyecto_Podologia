const { requireLocalEnv } = require("./_shared/local-env");

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_error) {
    data = null;
  }

  return { status: response.status, data };
}

async function patchJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function run() {
  const baseUrl = "http://127.0.0.1:4000/api";
  const suffix = Date.now();
  const adminEmail = requireLocalEnv("ADMIN_EMAIL");
  const adminPassword = requireLocalEnv("ADMIN_PASSWORD");
  const staffPassword = `Staff!${suffix}`;
  const ownerPassword = `Owner!${suffix}`;
  const ownerLogin = await postJson(`${baseUrl}/auth/login`, {
    email: adminEmail,
    password: adminPassword,
  });

  const ownerToken = ownerLogin.data?.token;
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  const unauthorizedServiceCreate = await postJson(`${baseUrl}/services`, {
    name: "Servicio bloqueado",
    slug: `servicio-bloqueado-${suffix}`,
    description: "Intento sin autenticacion",
    durationMin: 30,
  });

  const createStaff = await postJson(
    `${baseUrl}/users`,
    {
      fullName: "Staff Seguridad",
      email: `staff-security-${suffix}@piessanos.com`,
      password: staffPassword,
      role: "STAFF",
    },
    ownerHeaders
  );

  const staffLogin = await postJson(`${baseUrl}/auth/login`, {
    email: `staff-security-${suffix}@piessanos.com`,
    password: staffPassword,
  });

  const staffHeaders = { Authorization: `Bearer ${staffLogin.data?.token}` };
  const forbiddenServiceCreate = await postJson(
    `${baseUrl}/services`,
    {
      name: "Servicio staff",
      slug: `servicio-staff-${suffix}`,
      description: "Intento sin permisos suficientes",
      durationMin: 30,
    },
    staffHeaders
  );

  const invalidPublicAppointment = await postJson(`${baseUrl}/appointments`, {
    serviceId: 1,
    date: "2026-03-30",
    startTime: "09:00",
    client: {
      firstName: "1",
      lastName: "2",
      phone: "abc",
      email: "mal",
    },
  });

  const loginAttempts = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await postJson(`${baseUrl}/auth/login`, {
      email: `abuse-${suffix}@mail.com`,
      password: "wrong-password",
    });
    loginAttempts.push(response.status);
  }

  const ownerForbiddenUserCreate = await postJson(
    `${baseUrl}/users`,
    {
      fullName: "Otro Owner",
      email: `otro-owner-${suffix}@mail.com`,
      password: ownerPassword,
      role: "OWNER",
    },
    staffHeaders
  );

  const statusUpdate = await patchJson(
    `${baseUrl}/appointments/1/status`,
    { status: "CONFIRMED" },
    staffHeaders
  );

  console.log(
    JSON.stringify(
      {
        unauthorizedServiceCreate: unauthorizedServiceCreate.status,
        ownerCreatedStaff: createStaff.status,
        forbiddenServiceCreate: forbiddenServiceCreate.status,
        invalidPublicAppointment: invalidPublicAppointment.status,
        loginAttempts,
        ownerForbiddenUserCreate: ownerForbiddenUserCreate.status,
        staffStatusUpdate: statusUpdate.status,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
