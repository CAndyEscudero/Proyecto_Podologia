const { chromium } = require("playwright");
const { requireLocalEnv } = require("./_shared/local-env");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";
const ADMIN_EMAIL = requireLocalEnv("ADMIN_EMAIL");
process.env.DATABASE_URL = process.env.DATABASE_URL || requireLocalEnv("DATABASE_URL");

const { prisma } = require("../backend/src/config/prisma");
const { signJwt } = require("../backend/src/utils/jwt");

async function authenticateAdmin() {
  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL.toLowerCase() } });

  if (!user || !user.isActive) {
    throw new Error("No se encontro un admin activo para el escenario.");
  }

  return signJwt({ userId: user.id, role: user.role });
}

async function buildScenario() {
  const servicesResponse = await fetch(`${API_URL}/services`);
  if (!servicesResponse.ok) {
    throw new Error(`No se pudieron cargar servicios (${servicesResponse.status})`);
  }

  const services = await servicesResponse.json();
  const service = services.find((item) => item.isActive !== false);

  if (!service) {
    throw new Error("No hay servicios activos para el escenario admin.");
  }

  for (let offset = 1; offset <= 30; offset += 1) {
    const candidate = new Date();
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() + offset);
    const date = candidate.toISOString().slice(0, 10);

    const availabilityResponse = await fetch(
      `${API_URL}/availability/slots?serviceId=${service.id}&date=${date}`
    );

    if (!availabilityResponse.ok) {
      continue;
    }

    const availability = await availabilityResponse.json();
    if (availability.slots?.length >= 5) {
      return {
        service,
        date,
        createSlot: availability.slots[0],
        rescheduleSlot: availability.slots[4],
      };
    }
  }

  throw new Error("No se encontro una fecha con suficientes slots para el escenario admin.");
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const result = {
    loggedIn: false,
    appointmentsLoaded: false,
    manualCreateOpened: false,
    appointmentCreated: false,
    appointmentEdited: false,
    appointmentRescheduled: false,
    appointmentDeleted: false,
  };

  const phone = `3462${Date.now().toString().slice(-6)}`;
  const initialName = `Paciente ${Date.now().toString().slice(-4)}`;
  const editedName = `${initialName} Editado`;
    const token = await authenticateAdmin();
    const scenario = await buildScenario();

  try {
    await page.addInitScript((value) => {
      window.localStorage.setItem("podologia_admin_token", value);
    }, token);

    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    result.loggedIn = true;

    await page.waitForSelector("text=Alta manual de turnos", { timeout: 15000 });
    result.appointmentsLoaded = true;

    const manager = page.locator("section").filter({ hasText: "Alta manual de turnos" }).first();
    const createModeButton = page.getByRole("button", { name: "Nuevo manual" });

    if ((await createModeButton.count()) > 0) {
      await createModeButton.click();
    }

    await page.waitForSelector("text=Carga turnos manualmente", { timeout: 15000 });
    result.manualCreateOpened = true;

    await manager.locator('select').first().selectOption(String(scenario.service.id));
    await manager.locator('input[type="date"]').first().fill(scenario.date);
    await page.evaluate((slotLabel) => {
      window.__slotLabel = slotLabel;
    }, `${scenario.createSlot.startTime} - ${scenario.createSlot.endTime}`);
    await page.waitForFunction(() => {
      const root = Array.from(document.querySelectorAll("section")).find((node) => node.textContent.includes("Alta manual de turnos"));
      if (!root) return false;
      const selects = Array.from(root.querySelectorAll("select"));
      return selects.some((select) => Array.from(select.options).some((option) => option.textContent.includes(window.__slotLabel)));
    }, { timeout: 15000, polling: 250 });
    await manager.locator('select').nth(1).selectOption(scenario.createSlot.startTime);
    await manager.locator('input[type="text"]').nth(0).fill(initialName);
    await manager.locator('input[type="text"]').nth(1).fill("Prueba");
    await manager.locator('input[type="text"]').nth(2).fill(phone);
    await manager.locator('input[type="email"]').fill(`test-${phone}@mail.com`);
    await manager.locator('textarea').first().fill("Turno creado desde admin");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/appointments") &&
          response.request().method() === "POST" &&
          response.status() === 201,
        { timeout: 15000 }
      ),
      manager.getByRole("button", { name: "Crear turno manual" }).click(),
    ]);
    result.appointmentCreated = true;

    await page.getByRole("button", { name: "Gestion de turnos" }).click();
    await page.waitForSelector("text=Agenda y gestion de turnos", { timeout: 15000 });
    await page.getByTestId("appointments-filter-date-from").fill(scenario.date);
    await page.getByTestId("appointments-filter-date-to").fill(scenario.date);
    await page.getByTestId("appointments-filter-client").fill(initialName);

    const appointmentCard = page.locator("article").filter({ hasText: initialName }).first();
    await appointmentCard.waitFor({ timeout: 15000 });

    await appointmentCard.getByRole("button", { name: "Editar" }).click();
    await page.waitForSelector("text=Editar datos del turno", { timeout: 15000 });

    const editManager = page.locator("section").filter({ hasText: "Editar datos del turno" }).first();
    await editManager.locator('input[type="text"]').nth(0).fill(editedName);
    await editManager.locator('select').first().selectOption("CONFIRMED");
    await editManager.locator('textarea').nth(0).fill("Paciente frecuente");
    await editManager.locator('textarea').nth(1).fill("Confirmado por admin");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          /\/api\/appointments\/\d+$/.test(response.url()) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
        { timeout: 15000 }
      ),
      editManager.getByRole("button", { name: "Guardar cambios" }).click(),
    ]);
    result.appointmentEdited = true;

    const editedCard = page.locator("article").filter({ hasText: editedName }).first();
    await editedCard.waitFor({ timeout: 15000 });
    await editedCard.getByRole("button", { name: "Reprogramar" }).click();
    await page.waitForSelector("text=Reprogramar turno", { timeout: 15000 });
    const rescheduleManager = page.locator("section").filter({ hasText: "Reprogramar turno" }).first();
    await rescheduleManager.locator('input[type="date"]').first().fill(scenario.date);
    await page.evaluate((slotLabel) => {
      window.__rescheduleSlotLabel = slotLabel;
    }, `${scenario.rescheduleSlot.startTime} - ${scenario.rescheduleSlot.endTime}`);
    await page.waitForFunction(() => {
      const root = Array.from(document.querySelectorAll("section")).find((node) => node.textContent.includes("Reprogramar turno"));
      if (!root) return false;
      const selects = Array.from(root.querySelectorAll("select"));
      return selects.some((select) => Array.from(select.options).some((option) => option.textContent.includes(window.__rescheduleSlotLabel)));
    }, { timeout: 15000, polling: 250 });
    await rescheduleManager.locator('select').first().selectOption(scenario.rescheduleSlot.startTime);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          /\/api\/appointments\/\d+\/reschedule$/.test(response.url()) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
        { timeout: 15000 }
      ),
      rescheduleManager.getByRole("button", { name: "Confirmar reprogramacion" }).click(),
    ]);
    result.appointmentRescheduled = true;

    const rescheduledCard = page.locator("article").filter({ hasText: editedName }).first();
    await rescheduledCard.waitFor({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse(
        (response) =>
          /\/api\/appointments\/\d+$/.test(response.url()) &&
          response.request().method() === "DELETE" &&
          response.status() === 204,
        { timeout: 15000 }
      ),
      rescheduledCard.getByRole("button", { name: "Eliminar" }).click(),
    ]);
    result.appointmentDeleted = true;
  } catch (error) {
    result.error = error.message;
  } finally {
    await prisma.$disconnect();
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run();
