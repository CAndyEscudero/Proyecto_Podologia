const crypto = require("node:crypto");

function requestContext(req, res, next) {
  const incomingRequestId = req.get("x-request-id");
  const requestId = incomingRequestId || crypto.randomUUID();

  req.requestId = requestId;
  req.requestStartedAt = Date.now();
  res.setHeader("x-request-id", requestId);

  next();
}

module.exports = {
  requestContext,
};
