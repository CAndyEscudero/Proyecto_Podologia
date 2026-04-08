function buildAllowedOrigins(env) {
  return new Set([
    env.frontendUrl,
    env.appBaseUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ]);
}

function isDevelopmentOrigin(origin, nodeEnv) {
  if (nodeEnv === "production") {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  } catch (error) {
    return false;
  }
}

function createCorsOriginResolver({ allowedOrigins, nodeEnv }) {
  return function resolveCorsOrigin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isDevelopmentOrigin(origin, nodeEnv)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  };
}

module.exports = {
  buildAllowedOrigins,
  createCorsOriginResolver,
  isDevelopmentOrigin,
};
