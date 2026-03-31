export type UserRole = "OWNER" | "ADMIN" | "STAFF";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";

export type AvailabilityRuleType = "WORKING_HOURS" | "BREAK";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Professional {
  id: number;
  fullName: string;
  bio: string;
  acceptsAllServices: boolean;
  serviceIds: number[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  source: string;
  createdAt?: string;
  updatedAt?: string;
  client: Client;
  service: Service;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityRule {
  id: number;
  dayOfWeek: number;
  type: AvailabilityRuleType;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockedDate {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt?: string;
}

export interface BusinessSettings {
  id: number;
  businessName: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  appointmentGapMin: number;
  bookingWindowDays: number;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}
