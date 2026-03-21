import { http } from "../../../../shared/api/http";
import type { BusinessSettings } from "../../../../shared/types/domain";
import type { UpdateBusinessSettingsPayload } from "../types/business-settings.types";

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { data } = await http.get<BusinessSettings>("/business-settings");
  return data;
}

export async function updateBusinessSettings(
  payload: UpdateBusinessSettingsPayload
): Promise<BusinessSettings> {
  const { data } = await http.patch<BusinessSettings>("/business-settings", payload);
  return data;
}
