const { buildRequestLogContext, logInfo, logWarn } = require("../observability/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const metadata = buildRequestLogContext(req, {
      statusCode: res.statusCode,
      durationMs,
      contentLength: res.getHeader("content-length") || null,
    });

    if (res.statusCode >= 500) {
      logWarn("http.request.failed", metadata);
      return;
    }

    logInfo("http.request.completed", metadata);
  });

  next();
}

module.exports = {
  requestLogger,
};
