import type { BusinessSettings } from "../../../../shared/types/domain";

export type { BusinessSettings } from "../../../../shared/types/domain";

export interface UpdateBusinessSettingsPayload {
  businessName?: string;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  appointmentGapMin?: number;
  bookingWindowDays?: number;
  depositPercentage?: number;
  mercadoPagoEnabled?: boolean;
  transactionalEmailEnabled?: boolean;
  transactionalEmailFromName?: string | null;
  transactionalEmailReplyTo?: string | null;
  whatsAppEnabled?: boolean;
  whatsAppNumber?: string | null;
  whatsAppDefaultMessage?: string | null;
  timezone?: string;
}

export interface BusinessSettingsFormValues {
  businessName: string;
  contactEmail: string;
  phone: string;
  address: string;
  appointmentGapMin: number;
  bookingWindowDays: number;
  depositPercentage: number;
  mercadoPagoEnabled: boolean;
  transactionalEmailEnabled: boolean;
  transactionalEmailFromName: string;
  transactionalEmailReplyTo: string;
  whatsAppEnabled: boolean;
  whatsAppNumber: string;
  whatsAppDefaultMessage: string;
  timezone: string;
}
