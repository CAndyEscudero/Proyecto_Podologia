import type { ReactNode } from "react";
import type { Client, Service, AvailabilitySlot } from "../../../shared/types/domain";
import type { AvailableSlotsResponse, CreateAppointmentResponse } from "../../../shared/types/api";
import type {
  AppointmentClientPayload,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
} from "../../admin/appointments/types/appointments.types";

export type { Client, Service, AvailabilitySlot } from "../../../shared/types/domain";
export type { AvailableSlotsResponse, CreateAppointmentResponse } from "../../../shared/types/api";
export type {
  AppointmentClientPayload,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
} from "../../admin/appointments/types/appointments.types";

export interface BookingFormValues {
  serviceId: string;
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface BookingStep {
  id: 1 | 2 | 3 | 4;
  label: string;
  copy: string;
}

export interface NextAvailableOption {
  date: string;
  firstSlot: string;
  slotsCount: number;
}

export interface BookingCalendarProps {
  value: string;
  onChange: (value: string) => void;
  minDate: string;
  maxDate: string;
}

export interface BookingFieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
}

export interface BookingSummaryRowProps {
  label: string;
  value: string;
}
