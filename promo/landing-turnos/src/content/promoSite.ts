const WHATSAPP_NUMBER = '5493462000000';

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const promoSite = {
  brandName: 'Resergo',
  demoUrl: 'https://demo.resergo.com.ar',
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappDemoUrl: buildWhatsAppUrl(
    'Hola! Quiero probar la demo de Resergo y ver cómo quedaría para mi local.'
  ),
  whatsappSalesUrl: buildWhatsAppUrl(
    'Hola! Quiero conocer Resergo para mi local y entender cómo funciona la implementación.'
  ),
  whatsappImplementationUrl: buildWhatsAppUrl(
    'Hola! Quiero solicitar la implementación asistida de Resergo para mi local.'
  ),
  whatsappCallUrl: buildWhatsAppUrl(
    'Hola! Quiero coordinar una llamada para que me muestren Resergo.'
  ),
} as const;
