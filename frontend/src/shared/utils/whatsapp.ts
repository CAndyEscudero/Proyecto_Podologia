import { siteConfig } from "../../app/config/site-config";

export function normalizeWhatsAppNumber(value: string): string {
  return String(value || "").replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(
  message: string,
  whatsappNumber = siteConfig.whatsappNumber
): string | null {
  const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);

  if (!normalizedNumber) {
    return null;
  }

  const url = new URL(`https://wa.me/${normalizedNumber}`);
  url.searchParams.set("text", message);
  return url.toString();
}
