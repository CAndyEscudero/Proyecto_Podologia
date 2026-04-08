const dotenv = require("dotenv");

dotenv.config();

function normalizeDomainLikeValue(value, fallback = "") {
  const normalized = String(value || fallback).trim().toLowerCase();
  return normalized.replace(/\.$/, "");
}

const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  appBaseUrl: process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:4000",
  platformApexDomain: normalizeDomainLikeValue(process.env.PLATFORM_APEX_DOMAIN, "localhost"),
  caddyOnDemandAskSecret: process.env.CADDY_ON_DEMAND_ASK_SECRET || "",
  platformDomainCnameTarget: normalizeDomainLikeValue(
    process.env.PLATFORM_DOMAIN_CNAME_TARGET,
    process.env.PLATFORM_APEX_DOMAIN || "localhost"
  ),
  platformDomainARecords: String(process.env.PLATFORM_DOMAIN_A_RECORDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  platformDomainSslStrategy: (process.env.PLATFORM_DOMAIN_SSL_STRATEGY || "INFRASTRUCTURE_MANAGED")
    .trim()
    .toUpperCase(),
  tenantDevFallbackHostname: (process.env.TENANT_DEV_FALLBACK_HOSTNAME || "pies-sanos-venado.localhost")
    .trim()
    .toLowerCase(),
  mercadoPagoOauthClientId: process.env.MERCADO_PAGO_OAUTH_CLIENT_ID || "",
  mercadoPagoOauthClientSecret: process.env.MERCADO_PAGO_OAUTH_CLIENT_SECRET || "",
  mercadoPagoOauthRedirectUri: process.env.MERCADO_PAGO_OAUTH_REDIRECT_URI || "",
  mercadoPagoPlatformWebhookSecret:
    process.env.MERCADO_PAGO_PLATFORM_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET || "",
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN || "",
  mercadoPagoPublicKey: process.env.MP_PUBLIC_KEY || "",
  mercadoPagoWebhookSecret: process.env.MP_WEBHOOK_SECRET || "",
  emailProvider: (process.env.EMAIL_PROVIDER || "resend").trim().toLowerCase(),
  resendApiKey: process.env.RESEND_API_KEY || "",
  platformEmailFrom: process.env.PLATFORM_EMAIL_FROM || "onboarding@resend.dev",
  jobsEnabled: String(process.env.JOBS_ENABLED || "true").trim().toLowerCase() !== "false",
  pendingReservationsJobIntervalMs: Number(
    process.env.PENDING_RESERVATIONS_JOB_INTERVAL_MS || 60 * 1000
  ),
  appointmentReminderJobIntervalMs: Number(
    process.env.APPOINTMENT_REMINDER_JOB_INTERVAL_MS || 5 * 60 * 1000
  ),
  appointmentReminderLeadMinutes: Number(
    process.env.APPOINTMENT_REMINDER_LEAD_MINUTES || 24 * 60
  ),
  appointmentReminderRetryDelayMinutes: Number(
    process.env.APPOINTMENT_REMINDER_RETRY_DELAY_MINUTES || 30
  ),
  appointmentReminderMaxAttempts: Number(
    process.env.APPOINTMENT_REMINDER_MAX_ATTEMPTS || 3
  ),
  logLevel: (process.env.LOG_LEVEL || "info").trim().toLowerCase(),
  frontendErrorLoggingEnabled:
    String(process.env.FRONTEND_ERROR_LOGGING_ENABLED || "true").trim().toLowerCase() !== "false",
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
