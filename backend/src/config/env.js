const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  appBaseUrl: process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:4000",
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN || "",
  mercadoPagoPublicKey: process.env.MP_PUBLIC_KEY || "",
  mercadoPagoWebhookSecret: process.env.MP_WEBHOOK_SECRET || "",
  mercadoPagoSuccessUrl:
    process.env.MP_SUCCESS_URL ||
    `${process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/reservas/resultado?status=success`,
  mercadoPagoPendingUrl:
    process.env.MP_PENDING_URL ||
    `${process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/reservas/resultado?status=pending`,
  mercadoPagoFailureUrl:
    process.env.MP_FAILURE_URL ||
    `${process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/reservas/resultado?status=failure`,
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5),
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (env.nodeEnv === "production" && env.jwtSecret === "change_me") {
  throw new Error("JWT_SECRET must be configured in production");
}

module.exports = { env };
