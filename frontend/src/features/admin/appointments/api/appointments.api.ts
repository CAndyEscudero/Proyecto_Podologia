import { http } from "../../../../shared/api/http";
import type { CreateAppointmentResponse } from "../../../../shared/types/api";
import type { Appointment } from "../../../../shared/types/domain";
import type {
  AppointmentFilters,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
  UpdateAppointmentPayload,
  UpdateAppointmentStatusPayload,
} from "../types/appointments.types";

export async function getAppointments(params: AppointmentFilters): Promise<Appointment[]> {
  const { data } = await http.get<Appointment[]>("/appointments", { params });
  return data;
}

export async function createAppointment(
  payload: CreateAppointmentPayload
): Promise<CreateAppointmentResponse> {
  const { data } = await http.post<CreateAppointmentResponse>("/appointments", payload);
  return data;
}

export async function updateAppointment(
  id: number,
  payload: UpdateAppointmentPayload
): Promise<Appointment> {
  const { data } = await http.patch<Appointment>(`/appointments/${id}`, payload);
  return data;
}

export async function deleteAppointment(id: number): Promise<void> {
  await http.delete(`/appointments/${id}`);
}

export async function updateAppointmentStatus(
  id: number,
  status: UpdateAppointmentStatusPayload["status"]
): Promise<Appointment> {
  const payload: UpdateAppointmentStatusPayload = { status };
  const { data } = await http.patch<Appointment>(`/appointments/${id}/status`, payload);
  return data;
}

export async function rescheduleAppointment(
  id: number,
  payload: RescheduleAppointmentPayload
): Promise<Appointment> {
  const { data } = await http.patch<Appointment>(`/appointments/${id}/reschedule`, payload);
  return data;
}
