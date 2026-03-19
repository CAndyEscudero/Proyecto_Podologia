const { chromium } = require("playwright");
const { requireLocalEnv } = require("./_shared/local-env");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";
const DASHBOARD_READY_TEXTS = ["Panel administrativo", "Centro de control"];
const ADMIN_EMAIL = requireLocalEnv("ADMIN_EMAIL");
const ADMIN_PASSWORD = requireLocalEnv("ADMIN_PASSWORD");

async function getDashboardScenario() {
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`No se pudo autenticar para preparar el escenario (${loginResponse.status})`);
  }

  const { token } = await loginResponse.json();
  const appointmentsResponse = await fetch(
    `${API_URL}/appointments?dateFrom=${new Date().toISOString().slice(0, 10)}&dateTo=2026-04-15`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!appointmentsResponse.ok) {
    throw new Error(`No se pudieron cargar turnos para el escenario (${appointmentsResponse.status})`);
  }

  const appointments = await appointmentsResponse.json();
  const editableAppointment = appointments.find((appointment) => appointment.status !== "COMPLETED");

  if (!editableAppointment) {
    throw new Error("No se encontro un turno editable para validar el dashboard");
  }

  const nextStatus =
    editableAppointment.status === "PENDING" ? "CONFIRMED" : "PENDING";

  return {
    appointment: editableAppointment,
    nextStatus,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const result = {
    loggedIn: false,
    dashboardLoaded: false,
    filtersApplied: false,
    rowsVisible: 0,
    statusChanged: false,
  };

  try {
    const scenario = await getDashboardScenario();

    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle", timeout: 30000 });

    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Ingresar/i }).click();

    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    result.loggedIn = true;

    await Promise.any(
      DASHBOARD_READY_TEXTS.map((text) =>
        page.waitForSelector(`text=${text}`, { timeout: 15000 })
      )
    );
    result.dashboardLoaded = true;

    await page.getByRole("button", { name: "Gestion de turnos" }).click();
    await page.getByRole("button", { name: "Tabla" }).click();

    await page.getByTestId("appointments-filter-date-from").fill(scenario.appointment.date);
    await page.getByTestId("appointments-filter-date-to").fill(scenario.appointment.date);
    await page
      .getByTestId("appointments-filter-service")
      .selectOption(String(scenario.appointment.serviceId));
    await page.getByTestId("appointments-filter-status").selectOption(scenario.appointment.status);
    await page.waitForTimeout(1500);
    result.filtersApplied = true;

    const rows = page.locator("tbody tr");
    result.rowsVisible = await rows.count();

    if (result.rowsVisible > 0) {
      const targetRow = rows
        .filter({ hasText: scenario.appointment.client.firstName })
        .filter({ hasText: scenario.appointment.client.lastName })
        .first();

      const initialBadge = await targetRow.locator("td").nth(4).textContent();
      const actionButton = targetRow.getByRole("button", {
        name: new RegExp(scenario.nextStatus === "CONFIRMED" ? "Confirmado" : "Pendiente", "i"),
      });

      await actionButton.click();
      await page.waitForTimeout(1200);
      const newBadge = await targetRow.locator("td").nth(4).textContent();
      result.statusChanged = initialBadge?.trim() !== newBadge?.trim();
    }
  } catch (error) {
    result.error = error.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run();
