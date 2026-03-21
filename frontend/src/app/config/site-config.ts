import { env } from "./env";

interface SiteConfig {
  businessName: string;
  location: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  instagramUrl: string;
  heroTitle: string;
  heroCopy: string;
}

export const siteConfig: SiteConfig = {
  businessName: env.businessName,
  location: "Venado Tuerto, Santa Fe",
  address: "Av. Casey 123, Venado Tuerto",
  phone: "+54 9 3462 000000",
  whatsappNumber: env.whatsappNumber,
  instagramUrl: "https://instagram.com/piessanosvt",
  heroTitle: "Cuidamos tus pies con una experiencia profesional, clara y cercana",
  heroCopy:
    "Tratamientos de podologia y pedicuria con foco en salud, bienestar e imagen cuidada, ahora con reserva online y gestion profesional de turnos.",
};
