const { logInfo } = require("../../observability/logger");

function logTenantDomainAudit(event, details = {}) {
  logInfo("tenant_domains.audit", {
    scope: "tenant-domains",
    event,
    ...details,
  });
}

module.exports = {
  logTenantDomainAudit,
};
