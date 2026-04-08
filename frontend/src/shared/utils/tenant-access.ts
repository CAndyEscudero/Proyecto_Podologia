import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../types/api";

export type TenantAccessIssueKind =
  | "admin_host_required"
  | "domain_not_connected"
  | "domain_pending"
  | "domain_failed"
  | "tenant_pending"
  | "tenant_suspended"
  | "tenant_cancelled"
  | "unknown";

export interface TenantAccessIssue {
  kind: TenantAccessIssueKind;
  title: string;
  description: string;
  actionHint: string;
  tone: "warning" | "danger";
  requestedHost: string;
}

interface AdminHostRequiredIssueInput {
  requestedHost: string;
  adminHostname?: string | null;
}

export function buildAdminHostRequiredIssue({
  requestedHost,
  adminHostname,
}: AdminHostRequiredIssueInput): TenantAccessIssue {
  return {
    kind: "admin_host_required",
    title: "Panel disponible solo en el dominio admin",
    description: adminHostname
      ? `Este dominio esta reservado para el sitio publico. Para administrar el negocio entra por ${adminHostname}.`
      : "Este dominio esta reservado para el sitio publico del negocio.",
    actionHint: adminHostname
      ? `Abre ${adminHostname}/admin/login para acceder al panel con la misma cuenta del tenant.`
      : "Usa el subdominio de plataforma del tenant para ingresar al panel administrativo.",
    tone: "warning",
    requestedHost,
  };
}

export function resolveTenantAccessIssue(
  error: unknown,
  currentHost = typeof window !== "undefined" ? window.location.host : ""
): TenantAccessIssue {
  const apiError = error as AxiosError<ApiErrorResponse>;
  const code = apiError.response?.data?.code;
  const details = apiError.response?.data?.details || {};
  const requestedHost =
    (typeof details.requestedHostname === "string" && details.requestedHostname) || currentHost || "este dominio";
  const adminHostname =
    typeof details.adminHostname === "string" ? details.adminHostname : null;
  const tenantStatus =
    typeof details.tenantStatus === "string" ? details.tenantStatus : null;
  const tenantName =
    (typeof details.tenantName === "string" && details.tenantName) || "Este negocio";

  if (code === "ADMIN_HOST_REQUIRED") {
    return buildAdminHostRequiredIssue({
      requestedHost,
      adminHostname,
    });
  }

  if (code === "TENANT_DOMAIN_NOT_FOUND") {
    return {
      kind: "domain_not_connected",
      title: "Dominio no conectado",
      description: `No encontramos un negocio activo asociado a ${requestedHost}.`,
      actionHint:
        "Si estas configurando un dominio propio, revisa DNS, la carga del hostname en TenantDomain y su activacion.",
      tone: "warning",
      requestedHost,
    };
  }

  if (code === "TENANT_DOMAIN_INACTIVE") {
    const domainStatus = typeof details.domainStatus === "string" ? details.domainStatus : null;

    if (domainStatus === "PENDING") {
      return {
        kind: "domain_pending",
        title: "Dominio en configuracion",
        description: `Encontramos ${requestedHost}, pero todavia no quedo habilitado para publicar el sitio.`,
        actionHint:
          "Completa la verificacion del dominio y espera su activacion antes de usarlo como URL publica o admin.",
        tone: "warning",
        requestedHost,
      };
    }

    return {
      kind: "domain_failed",
      title: "Dominio con error de configuracion",
      description: `El dominio ${requestedHost} existe, pero no se pudo habilitar correctamente.`,
      actionHint:
        "Revisa DNS, SSL o el estado del dominio guardado para este tenant antes de volver a usarlo.",
      tone: "danger",
      requestedHost,
    };
  }

  if (code === "TENANT_INACTIVE") {
    if (tenantStatus === "PENDING") {
      return {
        kind: "tenant_pending",
        title: "Negocio en preparacion",
        description: `${tenantName} existe, pero todavia no fue publicado para operar con este dominio.`,
        actionHint:
          "Activa el tenant desde la plataforma antes de habilitar reservas o acceso al panel administrativo.",
        tone: "warning",
        requestedHost,
      };
    }

    if (tenantStatus === "SUSPENDED") {
      return {
        kind: "tenant_suspended",
        title: "Negocio suspendido",
        description: `${tenantName} se encuentra suspendido temporalmente y su acceso esta bloqueado.`,
        actionHint:
          "Reactiva el tenant para volver a habilitar el sitio publico y el ingreso al panel admin.",
        tone: "danger",
        requestedHost,
      };
    }

    if (tenantStatus === "CANCELLED") {
      return {
        kind: "tenant_cancelled",
        title: "Negocio no disponible",
        description: `${tenantName} ya no esta disponible en la plataforma con este dominio.`,
        actionHint:
          "Si este dominio deberia seguir activo, revisa el estado del tenant y la asignacion del hostname.",
        tone: "danger",
        requestedHost,
      };
    }
  }

  return {
    kind: "unknown",
    title: "No pudimos cargar este negocio",
    description:
      apiError.response?.data?.message ||
      "Ocurrio un problema al resolver el tenant para este dominio.",
    actionHint:
      "Revisa el estado del tenant, la configuracion del dominio y la conectividad del backend antes de reintentar.",
    tone: "danger",
    requestedHost,
  };
}
