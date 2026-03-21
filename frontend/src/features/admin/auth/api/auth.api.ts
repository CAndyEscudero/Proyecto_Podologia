import { http } from "../../../../shared/api/http";
import type { LoginResponse, MeResponse } from "../../../../shared/types/api";
import type { LoginPayload } from "../types/auth.types";

export async function login(credentials: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", credentials);
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>("/auth/me");
  return data;
}
