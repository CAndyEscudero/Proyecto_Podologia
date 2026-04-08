const { logInfo } = require("../observability/logger");

function logJobAudit(event, details = {}) {
  logInfo("jobs.audit", {
    scope: "jobs",
    event,
    ...details,
  });
}

module.exports = {
  logJobAudit,
};
