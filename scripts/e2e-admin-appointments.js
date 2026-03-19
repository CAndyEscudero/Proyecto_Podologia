const { chromium } = require("playwright");
const { requireLocalEnv } = require("./_shared/local-env");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const ADMIN_EMAIL = requireLocalEnv("ADMIN_EMAIL");
const ADMIN_PASSWORD = requireLocalEnv("ADMIN_PASSWORD");

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

  try {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Ingresar/i }).click();

    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    result.loggedIn = true;

    await page.waitForSelector("text=Alta manual de turnos", { timeout: 15000 });
    result.appointmentsLoaded = true;

    const manager = page.locator("section").filter({ hasText: "Alta manual de turnos" }).first();
    await page.getByRole("button", { name: "Nuevo turno manual" }).click();
    await page.waitForSelector("text=Carga turnos manualmente", { timeout: 15000 });
    result.manualCreateOpened = true;

    await manager.locator('select').first().selectOption("1");
    await manager.locator('input[type="date"]').first().fill("2026-03-24");
    await page.waitForFunction(() => {
      const root = Array.from(document.querySelectorAll("section")).find((node) => node.textContent.includes("Alta manual de turnos"));
      if (!root) return false;
      const selects = Array.from(root.querySelectorAll("select"));
      return selects.some((select) => Array.from(select.options).some((option) => option.textContent.includes("09:00 - 09:45")));
    }, { timeout: 15000 });
    await manager.locator('select').nth(1).selectOption("09:00");
    await manager.locator('input[type="text"]').nth(0).fill(initialName);
    await manager.locator('input[type="text"]').nth(1).fill("Prueba");
    await manager.locator('input[type="text"]').nth(2).fill(phone);
    await manager.locator('input[type="email"]').fill(`test-${phone}@mail.com`);
    await manager.locator('textarea').first().fill("Turno creado desde admin");
    await manager.getByRole("button", { name: "Crear turno manual" }).click();

    await page.waitForSelector(`text=Turno #`, { timeout: 15000 });
    result.appointmentCreated = true;

    await manager.locator('input[type="text"]').nth(0).fill(editedName);
    await manager.locator('select').first().selectOption("CONFIRMED");
    await manager.locator('textarea').nth(0).fill("Paciente frecuente");
    await manager.locator('textarea').nth(1).fill("Confirmado por admin");
    await manager.getByRole("button", { name: "Guardar cambios" }).click();

    await page.waitForSelector("text=Confirmado por admin", { timeout: 15000 });
    result.appointmentEdited = true;

    await manager.getByRole("button", { name: "Reprogramar" }).first().click();
    await page.waitForSelector("text=Reprogramar turno", { timeout: 15000 });
    await manager.locator('input[type="date"]').first().fill("2026-03-24");
    await page.waitForFunction(() => {
      const root = Array.from(document.querySelectorAll("section")).find((node) => node.textContent.includes("Reprogramar turno"));
      if (!root) return false;
      const selects = Array.from(root.querySelectorAll("select"));
      return selects.some((select) => Array.from(select.options).some((option) => option.textContent.includes("10:00 - 10:45")));
    }, { timeout: 15000 });
    await manager.locator('select').first().selectOption("10:00");
    await manager.getByRole("button", { name: "Confirmar reprogramacion" }).click();

    await page.waitForSelector("text=10:00 - 10:45", { timeout: 15000 });
    result.appointmentRescheduled = true;

    await manager.getByRole("button", { name: "Editar" }).first().click();
    await manager.getByRole("button", { name: "Eliminar turno" }).click();
    await page.waitForSelector("text=Selecciona un turno en la tabla", { timeout: 15000 });
    result.appointmentDeleted = true;
  } catch (error) {
    result.error = error.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run();
