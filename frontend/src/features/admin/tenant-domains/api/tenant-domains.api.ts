import { http } from "../../../../shared/api/http";
import type {
  TenantDomainVerificationResponse,
  TenantDomainsOverview,
} from "../../../../shared/types/domain";

export async function getTenantDomainsOverview(): Promise<TenantDomainsOverview> {
  const { data } = await http.get<TenantDomainsOverview>("/tenant-domains");
  return data;
}

export async function upsertTenantCustomDomain(payload: {
  hostname: string;
}): Promise<TenantDomainsOverview> {
  const { data } = await http.put<TenantDomainsOverview>("/tenant-domains/custom", payload);
  return data;
}

export async function verifyTenantDomain(
  domainId: number
): Promise<TenantDomainVerificationResponse> {
  const { data } = await http.post<TenantDomainVerificationResponse>(
    `/tenant-domains/${domainId}/verify`
  );
  return data;
}

export async function setPrimaryTenantDomain(
  domainId: number
): Promise<TenantDomainsOverview> {
  const { data } = await http.patch<TenantDomainsOverview>(
    `/tenant-domains/${domainId}/primary`
  );
  return data;
}
