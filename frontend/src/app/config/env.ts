export const env = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  businessName: import.meta.env.VITE_BUSINESS_NAME || "Pies Sanos Venado",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || "5493462000000",
  frontendErrorLoggingEnabled:
    String(import.meta.env.VITE_FRONTEND_ERROR_LOGGING_ENABLED || "true").trim().toLowerCase() !==
    "false",
} as const;
