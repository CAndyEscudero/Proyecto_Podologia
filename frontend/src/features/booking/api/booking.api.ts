import { http } from "../../../shared/api/http";
import type {
  CreateAppointmentPaymentResponse,
  AvailableSlotsResponse,
} from "../../../shared/types/api";
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

export async function createPaymentReservation(
  payload: CreateAppointmentPayload
): Promise<CreateAppointmentPaymentResponse> {
  const { data } = await http.post<CreateAppointmentPaymentResponse>(
    "/appointments/payment-reservations",
    payload
  );
  return data;
}
