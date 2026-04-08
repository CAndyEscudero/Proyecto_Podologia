const { env } = require("../config/env");

const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getConfiguredLogLevel() {
  const requestedLevel = String(env.logLevel || "info").trim().toLowerCase();
  return LEVEL_PRIORITY[requestedLevel] ? requestedLevel : "info";
}

function shouldLog(level) {
  return (
    LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[getConfiguredLogLevel()]
  );
}

function sanitizeMetadata(value) {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMetadata);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeMetadata(nestedValue)])
    );
  }

  return value;
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name || "Error",
    message: error.message || "Unknown error",
    stack: error.stack || null,
    statusCode: error.statusCode || null,
    details: error.details || null,
  };
}

function writeLog(level, event, metadata = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...sanitizeMetadata(metadata),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  if (level === "debug") {
    console.debug(line);
    return;
  }

  console.info(line);
}

function buildRequestLogContext(req, extra = {}) {
  return {
    requestId: req.requestId || req.get("x-request-id") || null,
    method: req.method,
    path: req.originalUrl || req.url,
    tenantId: req.tenant?.id || null,
    hostname: req.tenant?.hostname || null,
    requestedHostname: req.tenant?.requestedHostname || req.get("host") || null,
    domainType: req.tenant?.domainType || null,
    userId: req.user?.id || null,
    ip: req.ip || null,
    userAgent: req.get("user-agent") || null,
    ...sanitizeMetadata(extra),
  };
}

function logDebug(event, metadata) {
  writeLog("debug", event, metadata);
}

function logInfo(event, metadata) {
  writeLog("info", event, metadata);
}

function logWarn(event, metadata) {
  writeLog("warn", event, metadata);
}

function logError(event, metadata) {
  writeLog("error", event, metadata);
}

module.exports = {
  buildRequestLogContext,
  logDebug,
  logError,
  logInfo,
  logWarn,
  serializeError,
};
