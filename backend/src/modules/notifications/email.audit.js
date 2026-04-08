const { logInfo } = require("../../observability/logger");

function logEmailAudit(event, details = {}) {
  logInfo("emails.audit", {
    scope: "emails",
    event,
    ...details,
  });
}

module.exports = {
  logEmailAudit,
};
