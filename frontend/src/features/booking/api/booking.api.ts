import { http } from "../../../shared/api/http";
import type { CreateAppointmentResponse, AvailableSlotsResponse } from "../../../shared/types/api";
import type { Service } from "../../../shared/types/domain";
import type { CreateAppointmentPayload } from "../types/booking.types";

export async function getPublicServices(): Promise<Service[]> {
  const { data } = await http.get<Service[]>("/services");
  return data;
}

export async function getAvailableSlots(
  serviceId: number | string,
  date: string
): Promise<AvailableSlotsResponse> {
  const { data } = await http.get<AvailableSlotsResponse>("/availability/slots", {
    params: { serviceId, date },
  });
  return data;
}

export async function createAppointment(
  payload: CreateAppointmentPayload
): Promise<CreateAppointmentResponse> {
  const { data } = await http.post<CreateAppointmentResponse>("/appointments", payload);
  return data;
}
