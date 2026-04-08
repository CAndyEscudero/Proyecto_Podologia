const { env } = require("../../config/env");
const { buildRequestLogContext, logError, logInfo, logWarn } = require("../../observability/logger");

async function reportFrontendErrorController(req, res) {
  if (!env.frontendErrorLoggingEnabled) {
    res.status(202).json({ received: false, disabled: true });
    return;
  }

  const severity = String(req.body?.severity || "error").trim().toLowerCase();
  const logFn = severity === "warn" ? logWarn : severity === "info" ? logInfo : logError;

  logFn("frontend.error.reported", buildRequestLogContext(req, {
    scope: "frontend",
    frontendMessage: req.body?.message || null,
    frontendSource: req.body?.source || null,
    frontendPathname: req.body?.pathname || null,
    frontendHref: req.body?.href || null,
    frontendUserAgent: req.body?.userAgent || null,
    frontendStack: req.body?.stack || null,
  }));

  res.status(202).json({ received: true });
}

module.exports = {
  reportFrontendErrorController,
};
