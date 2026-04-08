const {
  runAppointmentRemindersJob,
  runPendingReservationsExpirationJob,
} = require("../src/jobs/tenant-jobs.service");

async function main() {
  const target = String(process.argv[2] || "all").trim().toLowerCase();

  if (target === "all" || target === "expirations") {
    const expirationResult = await runPendingReservationsExpirationJob();
    console.log(JSON.stringify({ job: "expirations", result: expirationResult }, null, 2));
  }

  if (target === "all" || target === "reminders") {
    const reminderResult = await runAppointmentRemindersJob();
    console.log(JSON.stringify({ job: "reminders", result: reminderResult }, null, 2));
  }
}

main().catch((error) => {
  console.error("[jobs:run-once] Error");
  console.error(error?.message || error);
  process.exit(1);
});
