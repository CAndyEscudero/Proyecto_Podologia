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

    const businessNameInput = page.getByLabel("Nombre comercial");
    const bookingWindowInput = page.getByLabel("Ventana de reserva");
    const appointmentGapInput = page.getByLabel("Separacion entre turnos");

    await page.waitForFunction(
      () => {
        const input = document.querySelector('input[name="businessName"]');
        return Boolean(input && input.value.trim().length > 0);
      },
      undefined,
      { timeout: 15000 }
    );

    const businessName = await businessNameInput.inputValue();
    const windowInput = await bookingWindowInput.inputValue();
    result.valuesLoaded = Boolean(businessName) && Boolean(windowInput);

    await businessNameInput.fill(`Pies Sanos Venado ${suffix}`);
    await bookingWindowInput.fill("90");
    await appointmentGapInput.fill("20");
    await page.getByRole("button", { name: "Guardar configuracion" }).click({ force: true });
    await page.waitForTimeout(1200);

    const preview = page.getByText("90 dias").first();
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
