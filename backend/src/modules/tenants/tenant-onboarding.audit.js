const { logInfo } = require("../../observability/logger");

function logTenantOnboardingAudit(event, details = {}) {
  logInfo("tenant_onboarding.audit", {
    scope: "tenant-onboarding",
    event,
    ...details,
  });
}

module.exports = {
  logTenantOnboardingAudit,
};
