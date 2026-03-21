import type { BusinessSettings } from "../../../../shared/types/domain";

export type { BusinessSettings } from "../../../../shared/types/domain";

export interface UpdateBusinessSettingsPayload {
  businessName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  appointmentGapMin?: number;
  bookingWindowDays?: number;
  timezone?: string;
}
