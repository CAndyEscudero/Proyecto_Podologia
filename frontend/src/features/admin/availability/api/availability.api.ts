import { http } from "../../../../shared/api/http";
import type {
  AvailableSlotsResponseShape,
  CreateAvailabilityRulePayload,
  CreateBlockedDatePayload,
  UpdateAvailabilityRulePayload,
} from "../types/availability.types";
import type { AvailabilityRule, BlockedDate } from "../../../../shared/types/domain";

export async function getAvailableSlots(
  serviceId: number | string,
  date: string
): Promise<AvailableSlotsResponseShape> {
  const { data } = await http.get<AvailableSlotsResponseShape>("/availability/slots", {
    params: { serviceId, date },
  });
  return data;
}

export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  const { data } = await http.get<AvailabilityRule[]>("/availability/rules");
  return data;
}

export async function createAvailabilityRule(
  payload: CreateAvailabilityRulePayload
): Promise<AvailabilityRule> {
  const { data } = await http.post<AvailabilityRule>("/availability/rules", payload);
  return data;
}

export async function updateAvailabilityRule(
  id: number,
  payload: UpdateAvailabilityRulePayload
): Promise<AvailabilityRule> {
  const { data } = await http.patch<AvailabilityRule>(`/availability/rules/${id}`, payload);
  return data;
}

export async function deleteAvailabilityRule(id: number): Promise<void> {
  await http.delete(`/availability/rules/${id}`);
}

export async function getBlockedDates(): Promise<BlockedDate[]> {
  const { data } = await http.get<BlockedDate[]>("/availability/blocked-dates");
  return data;
}

export async function createBlockedDate(payload: CreateBlockedDatePayload): Promise<BlockedDate> {
  const { data } = await http.post<BlockedDate>("/availability/blocked-dates", payload);
  return data;
}

export async function deleteBlockedDate(id: number): Promise<void> {
  await http.delete(`/availability/blocked-dates/${id}`);
}
