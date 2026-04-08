import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildSiteConfig, defaultSiteConfig, type SiteConfig } from "../../../app/config/site-config";
import { getPublicBusinessSettings } from "../../admin/business-settings/api/business-settings.api";
import type { PublicBusinessSettings } from "../../../shared/types/domain";
import {
  resolveTenantAccessIssue,
  type TenantAccessIssue,
} from "../../../shared/utils/tenant-access";

interface PublicTenantContextValue {
  siteConfig: SiteConfig;
  publicSettings: PublicBusinessSettings | null;
  isLoading: boolean;
  hasResolved: boolean;
  errorMessage: string;
  tenantIssue: TenantAccessIssue | null;
}

const PublicTenantContext = createContext<PublicTenantContextValue | null>(null);

interface PublicTenantProviderProps {
  children: ReactNode;
}

export function PublicTenantProvider({ children }: PublicTenantProviderProps) {
  const [publicSettings, setPublicSettings] = useState<PublicBusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolved, setHasResolved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tenantIssue, setTenantIssue] = useState<TenantAccessIssue | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadPublicTenant() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        setTenantIssue(null);
        const data = await getPublicBusinessSettings();

        if (isCancelled) {
          return;
        }

        setPublicSettings(data);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const issue = resolveTenantAccessIssue(error);
        setPublicSettings(null);
        setTenantIssue(issue);
        setErrorMessage(issue.description);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setHasResolved(true);
        }
      }
    }

    void loadPublicTenant();

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = useMemo<PublicTenantContextValue>(
    () => ({
      siteConfig: buildSiteConfig(publicSettings),
      publicSettings,
      isLoading,
      hasResolved,
      errorMessage,
      tenantIssue,
    }),
    [errorMessage, hasResolved, isLoading, publicSettings, tenantIssue]
  );

  return <PublicTenantContext.Provider value={value}>{children}</PublicTenantContext.Provider>;
}

export function usePublicTenant() {
  const context = useContext(PublicTenantContext);

  if (!context) {
    return {
      siteConfig: defaultSiteConfig,
      publicSettings: null,
      isLoading: false,
      hasResolved: false,
      errorMessage: "",
      tenantIssue: null,
    };
  }

  return context;
}
