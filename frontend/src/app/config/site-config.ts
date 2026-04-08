import { env } from "./env";
import type { PublicBusinessSettings } from "../../shared/types/domain";

export interface SiteConfig {
  businessName: string;
  address: string;
  phone: string;
  contactEmail: string | null;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  whatsappDefaultMessage: string;
  instagramUrl: string | null;
  heroTitle: string;
  heroCopy: string;
}

export const defaultSiteConfig: SiteConfig = {
  businessName: env.businessName || "Agenda Online",
  address: "Direccion a configurar",
  phone: "Telefono a configurar",
  contactEmail: null,
  whatsappNumber: env.whatsappNumber,
  whatsappEnabled: Boolean(env.whatsappNumber),
  whatsappDefaultMessage: "Hola! Quiero consultar por un turno.",
  instagramUrl: null,
  heroTitle: "Reservas online claras, simples y listas para operar",
  heroCopy:
    "Una experiencia profesional para mostrar servicios, ordenar la agenda y facilitar el contacto con cada negocio.",
};

export const siteConfig = defaultSiteConfig;

export function buildSiteConfig(publicSettings: PublicBusinessSettings | null): SiteConfig {
  if (!publicSettings) {
    return defaultSiteConfig;
  }

  const businessName = publicSettings.businessName || defaultSiteConfig.businessName;
  const whatsappNumber = publicSettings.whatsAppNumber || defaultSiteConfig.whatsappNumber;
  const whatsappEnabled = Boolean(publicSettings.whatsAppEnabled && whatsappNumber);

  return {
    ...defaultSiteConfig,
    businessName,
    address: publicSettings.address || defaultSiteConfig.address,
    phone: publicSettings.phone || defaultSiteConfig.phone,
    contactEmail: publicSettings.contactEmail || defaultSiteConfig.contactEmail,
    whatsappNumber,
    whatsappEnabled,
    whatsappDefaultMessage:
      publicSettings.whatsAppDefaultMessage || defaultSiteConfig.whatsappDefaultMessage,
    heroTitle: `Reservas online para ${businessName}`,
    heroCopy:
      "Consulta servicios, elegi tu horario y contactate con el negocio desde una experiencia ordenada y profesional.",
  };
}
