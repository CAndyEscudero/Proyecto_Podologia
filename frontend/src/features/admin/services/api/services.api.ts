import { http } from "../../../../shared/api/http";
import type { Service } from "../../../../shared/types/domain";
import type { CreateServicePayload, UpdateServicePayload } from "../types/services.types";

export async function getServices(): Promise<Service[]> {
  const { data } = await http.get<Service[]>("/services");
  return data;
}

export async function createService(payload: CreateServicePayload): Promise<Service> {
  const { data } = await http.post<Service>("/services", payload);
  return data;
}

export async function updateService(id: number, payload: UpdateServicePayload): Promise<Service> {
  const { data } = await http.patch<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: number): Promise<void> {
  await http.delete(`/services/${id}`);
}
