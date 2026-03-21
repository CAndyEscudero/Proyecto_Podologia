export interface ApiErrorResponse {
  message?: string;
}

import type { Appointment, AvailabilitySlot, Service, User } from "./domain";

export interface LoginResponse {
  token: string;
}

export interface MeResponse {
  user: User;
}

export interface CreateAppointmentResponse {
  message: string;
  appointment: Appointment;
}

export interface AvailableSlotsResponse {
  date: string;
  service: Pick<Service, "id" | "name" | "durationMin">;
  slots: AvailabilitySlot[];
}
