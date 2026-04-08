export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: Record<string, unknown> | null;
}

import type { Appointment, AuthTenant, AvailabilitySlot, PaymentOption, Service, User } from "./domain";
import type { PaymentSummary } from "./payments";

export interface LoginResponse {
  token: string;
  tenant?: AuthTenant | null;
}

export interface MeResponse {
  user: User;
  tenant?: AuthTenant | null;
}

export interface CreateAppointmentResponse {
  message: string;
  appointment: Appointment;
}

export interface CreateAppointmentPaymentResponse {
  message: string;
  appointment: Appointment;
  paymentSummary: PaymentSummary & {
    paymentExpiresAt?: string | null;
  };
  checkoutUrl?: string;
  paymentOption?: PaymentOption;
}

export interface AvailableSlotsResponse {
  date: string;
  service: Pick<Service, "id" | "name" | "durationMin">;
  slots: AvailabilitySlot[];
}
