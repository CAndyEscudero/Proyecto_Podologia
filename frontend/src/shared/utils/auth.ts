import { buildTenantStorageKey } from "./tenant-storage";

const LEGACY_TOKEN_KEY = "podologia_admin_token";
const TOKEN_KEY = "podologia_admin_token";

export function getStoredToken(): string | null {
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  return window.localStorage.getItem(buildTenantStorageKey(TOKEN_KEY));
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(buildTenantStorageKey(TOKEN_KEY), token);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(buildTenantStorageKey(TOKEN_KEY));
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}
