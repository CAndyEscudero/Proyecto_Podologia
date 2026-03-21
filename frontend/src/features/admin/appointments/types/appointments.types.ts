import type { Appointment, AppointmentStatus } from "../../../../shared/types/domain";

export type { Appointment, AppointmentStatus } from "../../../../shared/types/domain";

export interface AdminSummaryItem {
  label: string;
  value: string;
  copy?: string;
}

export interface AppointmentFilters {
  dateFrom: string;
  dateTo: string;
  status: AppointmentStatus | "";
  client: string;
  serviceId: string;
}

export interface AppointmentClientPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface CreateAppointmentPayload {
  serviceId: number;
  date: string;
  startTime: string;
  client: AppointmentClientPayload;
}

export interface UpdateAppointmentPayload {
  status?: AppointmentStatus;
  notes?: string;
  client?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
}

export interface RescheduleAppointmentPayload {
  date: string;
  startTime: string;
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus;
}

export interface CreateAppointmentResponseShape {
  message: string;
  appointment: Appointment;
}
