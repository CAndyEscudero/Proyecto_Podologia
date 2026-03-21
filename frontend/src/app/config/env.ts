export const env = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  businessName: import.meta.env.VITE_BUSINESS_NAME || "Pies Sanos Venado",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || "5493462000000",
} as const;
