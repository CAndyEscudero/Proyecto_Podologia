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
    tabOpened: false,
    valuesLoaded: false,
    settingsSaved: false,
  };
  const suffix = Date.now().toString().slice(-4);

  try {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Ingresar/i }).click();

    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    result.loggedIn = true;

    await page.getByRole("button", { name: "Negocio" }).click();
    await page.waitForSelector("text=Configuracion del negocio", { timeout: 15000 });
    result.tabOpened = true;

    const businessName = await page.locator('input[type="text"]').first().inputValue();
    const windowInput = await page.locator('input[type="number"]').first().inputValue();
    result.valuesLoaded = Boolean(businessName) && Boolean(windowInput);

    await page.locator('input[type="text"]').first().fill(`Pies Sanos Venado ${suffix}`);
    await page.locator('input[type="number"]').first().fill("90");
    await page.locator('input[type="number"]').nth(1).fill("20");
    await page.getByRole("button", { name: "Guardar configuracion" }).click();
    await page.waitForTimeout(1200);

    const preview = page.locator("text=90 dias");
    await preview.waitFor({ timeout: 15000 });
    result.settingsSaved = true;
  } catch (error) {
    result.error = error.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run();
