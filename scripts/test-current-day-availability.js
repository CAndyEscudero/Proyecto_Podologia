const assert = require("node:assert/strict");
const { isPastSlotForDate } = require("../backend/src/utils/time");

function run() {
  const reference = new Date("2026-03-18T14:10:00");
  const today = "2026-03-18";
  const tomorrow = "2026-03-19";

  assert.equal(isPastSlotForDate(today, "09:00", reference), true);
  assert.equal(isPastSlotForDate(today, "14:00", reference), true);
  assert.equal(isPastSlotForDate(today, "14:15", reference), false);
  assert.equal(isPastSlotForDate(tomorrow, "09:00", reference), false);

  console.log(
    JSON.stringify(
      {
        helperChecked: true,
        reference: reference.toISOString(),
        assertions: 4,
      },
      null,
      2
    )
  );
}

run();
