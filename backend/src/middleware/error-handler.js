const {
  buildRequestLogContext,
  logError,
  logWarn,
  serializeError,
} = require("../observability/logger");

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  const metadata = buildRequestLogContext(req, {
    statusCode,
    error: serializeError(error),
  });

  if (statusCode >= 500) {
    logError("http.error", metadata);
  } else {
    logWarn("http.error", metadata);
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: error.details || null,
  });
}

module.exports = { errorHandler };
