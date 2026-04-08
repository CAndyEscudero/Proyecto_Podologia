const { logInfo } = require("../../observability/logger");

function logPaymentAudit(event, details = {}) {
  logInfo("payments.audit", {
    scope: "payments",
    event,
    ...details,
  });
}

module.exports = {
  logPaymentAudit,
};
