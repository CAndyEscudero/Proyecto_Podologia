const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5173";
const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";

async function findBookableScenario() {
  const servicesResponse = await fetch(`${API_URL}/services`);
  if (!servicesResponse.ok) {
    throw new Error(`No se pudieron cargar los servicios publicos (${servicesResponse.status})`);
  }

  const services = await servicesResponse.json();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const service of services) {
    for (let offset = 0; offset <= 30; offset += 1) {
      const candidate = new Date(today);
      candidate.setDate(today.getDate() + offset);
      const date = candidate.toISOString().slice(0, 10);
      const availabilityResponse = await fetch(
        `${API_URL}/availability/slots?serviceId=${service.id}&date=${date}`
      );

      if (!availabilityResponse.ok) {
        continue;
      }

      const availability = await availabilityResponse.json();
      if (availability.slots?.length) {
        return {
          service,
          date,
          slot: availability.slots[0],
        };
      }
    }
  }

  throw new Error("No se encontro ningun escenario reservable en los proximos 30 dias");
}

function getMonthDiff(fromDate, toDate) {
  return (
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth())
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const result = {
    servicesLoaded: false,
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    movedToStep2: false,
    confirmed: false,
    confirmationText: null,
  };

  try {
    const scenario = await findBookableScenario();

    await page.goto(`${BASE_URL}/reservas`, { waitUntil: "networkidle", timeout: 30000 });

    const serviceCard = page.getByTestId(`booking-service-card-${scenario.service.id}`);
    await serviceCard.waitFor({ timeout: 15000 });
    result.servicesLoaded = (await page.locator('[data-testid^="booking-service-card-"]').count()) > 0;
    await serviceCard.click();
    result.selectedService = scenario.service.name;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(`${scenario.date}T00:00:00`);
    const monthDiff = getMonthDiff(today, targetDate);

    for (let index = 0; index < monthDiff; index += 1) {
      await page.getByTestId("booking-calendar-next").click();
    }

    const targetDateButton = page.getByTestId(`booking-date-${scenario.date}`);
    await targetDateButton.waitFor({ timeout: 15000 });
    await targetDateButton.click({ force: true });
    result.selectedDate = scenario.date;

    const targetSlotButton = page.getByTestId(`booking-slot-${scenario.slot.startTime}`).first();
    await targetSlotButton.waitFor({ timeout: 15000 });
    result.selectedTime = scenario.slot.startTime;
    await targetSlotButton.click();

    await page.getByTestId("booking-step-client").waitFor({ timeout: 10000 });
    result.movedToStep2 = true;

    await page.getByTestId("booking-first-name").fill("Lucia");
    await page.getByTestId("booking-last-name").fill("Prueba");
    await page.getByTestId("booking-phone").fill("3462123456");
    await page.getByTestId("booking-email").fill(`lucia.${Date.now()}@test.local`);
    await page.getByTestId("booking-notes").fill("Prueba E2E del flujo completo.");

    await page.getByTestId("booking-submit").click();
    await page.waitForSelector("text=Codigo:", { timeout: 15000 });
    result.confirmed = true;
    result.confirmationText = await page.locator("text=Codigo:").locator("..").textContent();
  } catch (error) {
    result.error = error.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run();
