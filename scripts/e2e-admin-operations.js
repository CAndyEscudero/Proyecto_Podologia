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
    servicesTabLoaded: false,
    serviceCreated: false,
    serviceUpdated: false,
    serviceDeleted: false,
    availabilityTabLoaded: false,
    ruleCreated: false,
    ruleUpdated: false,
    ruleDeleted: false,
    blockedDateCreated: false,
    blockedDateDeleted: false,
  };

  const suffix = Date.now();
  const initialName = `Servicio panel ${suffix}`;
  const initialSlug = `servicio-panel-${suffix}`;
  const updatedName = `${initialName} editado`;
  const blockedDate = "2026-03-27";

  try {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle", timeout: 30000 });

    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Ingresar/i }).click();

    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    result.loggedIn = true;

    await page.getByRole("button", { name: "Servicios" }).click();
    await page.waitForSelector("text=Administra la oferta real", { timeout: 15000 });
    result.servicesTabLoaded = true;

    await page.locator('input[placeholder="Podologia clinica"]').fill(initialName);
    await page.locator('input[placeholder="podologia-clinica"]').fill(initialSlug);
    await page.locator('textarea').fill("Servicio generado desde Playwright para validar el panel admin.");
    await page.locator('input[type="number"]').first().fill("30");
    await page.locator('input[type="number"]').nth(1).fill("22000");
    await page.getByRole("button", { name: "Crear servicio" }).click();

    await page.waitForSelector(`text=${initialName}`, { timeout: 15000 });
    result.serviceCreated = true;

    const serviceCard = page.locator("article").filter({ hasText: initialName }).first();
    await serviceCard.getByRole("button", { name: "Editar" }).click();
    const nameInput = page.locator('input[placeholder="Podologia clinica"]');
    await page.waitForFunction(
      () => {
        const input = document.querySelector('input[placeholder="Podologia clinica"]');
        return input && input.value.includes("Servicio panel");
      },
      { timeout: 15000 }
    );
    await nameInput.fill(updatedName);
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await page.waitForSelector(`h3:has-text("${updatedName}")`, { timeout: 15000 });
    result.serviceUpdated = true;

    const updatedServiceCard = page.locator("article").filter({ hasText: updatedName }).first();
    await updatedServiceCard.getByRole("button", { name: "Desactivar" }).click();
    await page.waitForTimeout(1200);
    result.serviceDeleted = (await page.locator(`h3:has-text("${updatedName}")`).count()) === 0;

    await page.getByRole("button", { name: "Disponibilidad" }).click();
    await page.waitForSelector("text=Disponibilidad semanal", { timeout: 15000 });
    result.availabilityTabLoaded = true;

    const ruleForm = page.locator("form").first();
    await ruleForm.locator("select").first().selectOption("6");
    await ruleForm.locator("select").nth(1).selectOption("WORKING_HOURS");
    await ruleForm.locator('input[type="time"]').first().fill("10:00");
    await ruleForm.locator('input[type="time"]').nth(1).fill("12:00");
    await ruleForm.getByRole("button", { name: "Crear regla" }).click();

    const ruleCard = page.locator("article").filter({ hasText: "Sabado" }).filter({ hasText: "10:00 - 12:00" }).first();
    await ruleCard.waitFor({ timeout: 15000 });
    result.ruleCreated = true;

    await ruleCard.getByRole("button", { name: "Editar" }).click();
    await page.waitForFunction(
      () => {
        const inputs = Array.from(document.querySelectorAll('input[type="time"]'));
        return inputs.some((input) => input.value === "10:00") && inputs.some((input) => input.value === "12:00");
      },
      { timeout: 15000 }
    );
    await ruleForm.locator("select").nth(1).selectOption("BREAK");
    await ruleForm.locator('input[type="time"]').first().fill("10:30");
    await ruleForm.locator('input[type="time"]').nth(1).fill("11:00");
    await ruleForm.getByRole("button", { name: "Guardar cambios" }).click();

    const updatedRuleCard = page.locator("article").filter({ hasText: "Sabado" }).filter({ hasText: "10:30 - 11:00" }).first();
    await updatedRuleCard.waitFor({ timeout: 15000 });
    result.ruleUpdated = true;

    await updatedRuleCard.getByRole("button", { name: "Eliminar" }).click();
    await page.waitForTimeout(1200);
    result.ruleDeleted = (await page.locator("article").filter({ hasText: "10:30 - 11:00" }).count()) === 0;

    const blockedDateForm = page.locator("form").nth(1);
    await blockedDateForm.locator('input[type="date"]').fill(blockedDate);
    await blockedDateForm.locator('input[placeholder="Feriado, cierre, capacitacion"]').fill("Bloqueo e2e");
    await blockedDateForm.locator('input[type="time"]').first().fill("09:00");
    await blockedDateForm.locator('input[type="time"]').nth(1).fill("10:30");
    await blockedDateForm.getByRole("button", { name: "Bloquear fecha" }).click();

    const blockedCard = page.locator("article").filter({ hasText: "27/03/2026" }).filter({ hasText: "Bloqueo e2e" }).first();
    await blockedCard.waitFor({ timeout: 15000 });
    result.blockedDateCreated = true;

    await blockedCard.getByRole("button", { name: "Quitar bloqueo" }).click();
    await page.waitForTimeout(1200);
    result.blockedDateDeleted = (await page.locator("article").filter({ hasText: "Bloqueo e2e" }).count()) === 0;
  } catch (error) {
    result.error = error.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run();
