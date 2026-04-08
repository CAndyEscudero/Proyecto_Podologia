const tenantDomainsService = require("./tenant-domains.service");

async function getTenantDomainsOverviewController(req, res) {
  const overview = await tenantDomainsService.getTenantDomainsOverview(req.tenant);
  res.json(overview);
}

async function upsertTenantCustomDomainController(req, res) {
  const overview = await tenantDomainsService.upsertTenantCustomDomain(
    req.tenant,
    req.body.hostname
  );
  res.json(overview);
}

async function verifyTenantDomainController(req, res) {
  const result = await tenantDomainsService.verifyTenantDomain(
    req.tenant,
    Number(req.params.id)
  );
  res.json(result);
}

async function setPrimaryTenantDomainController(req, res) {
  const overview = await tenantDomainsService.setPrimaryTenantDomain(
    req.tenant,
    Number(req.params.id)
  );
  res.json(overview);
}

module.exports = {
  getTenantDomainsOverviewController,
  setPrimaryTenantDomainController,
  upsertTenantCustomDomainController,
  verifyTenantDomainController,
};
