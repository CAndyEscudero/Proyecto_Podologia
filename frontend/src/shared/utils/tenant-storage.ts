const FALLBACK_TENANT_HOST = "default-tenant";

export function getCurrentTenantHost(): string {
  if (typeof window === "undefined") {
    return FALLBACK_TENANT_HOST;
  }

  return window.location.host.toLowerCase() || FALLBACK_TENANT_HOST;
}

export function buildTenantStorageKey(baseKey: string, tenantHost = getCurrentTenantHost()): string {
  return `${baseKey}::${tenantHost}`;
}
