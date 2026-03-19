import { siteConfig } from "../app/siteConfig";

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
