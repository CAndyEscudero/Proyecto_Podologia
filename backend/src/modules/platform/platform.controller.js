const { env } = require("../../config/env");
const { logInfo, logWarn } = require("../../observability/logger");
const { canIssueTlsForHostname, normalizeHostname } = require("./platform.service");

async function tlsAllowDomainController(req, res) {
  const receivedSecret = String(req.query.secret || "");
  const requestedDomain = normalizeHostname(req.query.domain);

  if (!env.caddyOnDemandAskSecret || receivedSecret !== env.caddyOnDemandAskSecret) {
    logWarn("platform.tls.ask.denied", {
      scope: "platform",
      reason: "invalid_secret",
      domain: requestedDomain || null,
      ip: req.ip || null,
    });
    res.sendStatus(403);
    return;
  }

  if (!requestedDomain) {
    logWarn("platform.tls.ask.denied", {
      scope: "platform",
      reason: "invalid_domain",
      domain: null,
      ip: req.ip || null,
    });
    res.sendStatus(400);
    return;
  }

  const allowed = await canIssueTlsForHostname(requestedDomain);

  if (!allowed) {
    logWarn("platform.tls.ask.denied", {
      scope: "platform",
      reason: "domain_not_allowed",
      domain: requestedDomain,
      ip: req.ip || null,
    });
    res.sendStatus(403);
    return;
  }

  logInfo("platform.tls.ask.allowed", {
    scope: "platform",
    domain: requestedDomain,
    ip: req.ip || null,
  });
  res.sendStatus(200);
}

module.exports = {
  tlsAllowDomainController,
};
