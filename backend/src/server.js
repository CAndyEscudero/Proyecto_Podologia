const { app } = require("./app");
const { env } = require("./config/env");
const { startBackgroundJobs } = require("./jobs/job-runner");

const server = app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
});

const stopBackgroundJobs = startBackgroundJobs();

function shutdown(signal) {
  stopBackgroundJobs();
  server.close(() => {
    console.log(`Backend shutdown after ${signal}`);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
