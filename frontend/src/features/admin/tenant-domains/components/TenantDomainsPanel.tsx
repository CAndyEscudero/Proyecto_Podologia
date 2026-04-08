import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import {
  ExternalLink,
  Globe2,
  Link2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import type {
  TenantDomain,
  TenantDomainStatus,
  TenantDomainsOverview,
  TenantDomainVerification,
} from "../../../../shared/types/domain";
import type { ApiErrorResponse } from "../../../../shared/types/api";
import {
  getTenantDomainsOverview,
  setPrimaryTenantDomain,
  upsertTenantCustomDomain,
  verifyTenantDomain,
} from "../api/tenant-domains.api";

export function TenantDomainsPanel() {
  const [overview, setOverview] = useState<TenantDomainsOverview | null>(null);
  const [hostnameInput, setHostnameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [switchingPrimaryId, setSwitchingPrimaryId] = useState<number | null>(null);
  const [lastVerification, setLastVerification] = useState<TenantDomainVerification | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadOverview() {
      try {
        const data = await getTenantDomainsOverview();

        if (isCancelled) {
          return;
        }

        setOverview(data);
        setHostnameInput(data.customDomain?.hostname || "");
      } catch (error) {
        if (!isCancelled) {
          toast.error(getErrorMessage(error, "No se pudo cargar la configuracion de dominios"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hostnameInput.trim()) {
      toast.error("Ingresa un dominio antes de guardarlo");
      return;
    }

    try {
      setIsSaving(true);
      const data = await upsertTenantCustomDomain({ hostname: hostnameInput });
      setOverview(data);
      setHostnameInput(data.customDomain?.hostname || hostnameInput.trim());
      setLastVerification(null);
      toast.success("Dominio guardado. El siguiente paso es verificar el DNS.");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar el dominio custom"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVerify(domainId: number) {
    try {
      setVerifyingId(domainId);
      const response = await verifyTenantDomain(domainId);
      setOverview(response.overview);
      setHostnameInput(response.overview.customDomain?.hostname || "");
      setLastVerification(response.verification);

      if (response.verification.isValid) {
        toast.success("DNS validado correctamente");
      } else {
        toast.error(response.verification.message);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo verificar el DNS del dominio"));
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleSetPrimary(domainId: number) {
    try {
      setSwitchingPrimaryId(domainId);
      const data = await setPrimaryTenantDomain(domainId);
      setOverview(data);
      setHostnameInput(data.customDomain?.hostname || "");
      toast.success("Dominio publico principal actualizado");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el dominio principal"));
    } finally {
      setSwitchingPrimaryId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
        <div className="flex items-center gap-3 text-brand-wine">
          <Globe2 className="h-5 w-5" />
          <p className="text-sm font-bold uppercase tracking-[0.18em]">Dominios del tenant</p>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4 text-sm text-slate-600">
          <LoaderCircle className="h-4 w-4 animate-spin text-brand-wine" />
          Cargando configuracion de dominios...
        </div>
      </section>
    );
  }

  const platformDomain = overview?.platformDomain || null;
  const customDomain = overview?.customDomain || null;
  const primaryDomain = overview?.primaryDomain || null;

  return (
    <section className="rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-brand-wine">
            <Globe2 className="h-5 w-5" />
            <p className="text-sm font-bold uppercase tracking-[0.18em]">Dominios del tenant</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            El frente publico puede vivir en el subdominio de plataforma o en un dominio propio.
            El admin sigue operando sobre el dominio de plataforma mientras la estrategia v1 se mantiene simple.
          </p>
        </div>

        <div className="rounded-[1.3rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <p>
            <strong className="text-brand-ink">Publico principal:</strong>{" "}
            {primaryDomain?.hostname || "Sin resolver"}
          </p>
          <p className="mt-1">
            <strong className="text-brand-ink">Admin:</strong>{" "}
            {overview?.adminHostname || platformDomain?.hostname || "Sin dominio base"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-brand-ink">Dominio custom publico</span>
          <input
            type="text"
            value={hostnameInput}
            onChange={(event) => setHostnameInput(event.target.value)}
            className="field-input"
            placeholder="turnos.tunegocio.com o tunegocio.com.ar"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Guardalo aunque el DNS todavia no este apuntado. Despues podras verificarlo desde este mismo panel.
          </span>
        </label>

        <Button type="submit" className="min-w-56" disabled={isSaving}>
          {isSaving ? "Guardando dominio..." : "Guardar dominio custom"}
        </Button>
      </form>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <DomainCard
          title="Subdominio de plataforma"
          copy="Siempre queda disponible como fallback tecnico y como host inicial del admin."
          domain={platformDomain}
          actionLabel={platformDomain && !platformDomain.isPrimary ? "Usar como principal" : null}
          onAction={platformDomain ? () => handleSetPrimary(platformDomain.id) : undefined}
          isActionLoading={switchingPrimaryId === platformDomain?.id}
        />

        <DomainCard
          title="Dominio custom"
          copy={
            customDomain
              ? "Ideal para entregar una experiencia mas marca-propia al negocio."
              : "Todavia no hay un dominio propio conectado para este tenant."
          }
          domain={customDomain}
          emptyLabel="Sin dominio custom cargado"
          actionLabel={
            customDomain && customDomain.status === "ACTIVE" && !customDomain.isPrimary
              ? "Usar como principal"
              : null
          }
          onAction={customDomain ? () => handleSetPrimary(customDomain.id) : undefined}
          isActionLoading={switchingPrimaryId === customDomain?.id}
          secondaryActionLabel={customDomain ? "Verificar DNS" : null}
          onSecondaryAction={customDomain ? () => handleVerify(customDomain.id) : undefined}
          isSecondaryActionLoading={verifyingId === customDomain?.id}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-brand-wine">
            <Link2 className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Instrucciones DNS</p>
          </div>

          {customDomain ? (
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p className="font-semibold text-brand-ink">{customDomain.setup.summary}</p>
              <div className="rounded-[1rem] border border-rose-100 bg-rose-50/45 px-4 py-3">
                <p>
                  <strong className="text-brand-ink">Tipo de registro:</strong>{" "}
                  {formatSetupMode(customDomain.setup.mode)}
                </p>
                <p className="mt-1 break-all">
                  <strong className="text-brand-ink">Host:</strong> {customDomain.setup.host}
                </p>
                <p className="mt-1 break-all">
                  <strong className="text-brand-ink">Valor esperado:</strong>{" "}
                  {customDomain.setup.values.length
                    ? customDomain.setup.values.join(", ")
                    : "Todavia no configurado en la plataforma"}
                </p>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Si el proveedor de DNS tarda en propagar cambios, repite la verificacion unos minutos despues.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Cuando cargues el dominio custom, aca vas a ver exactamente que registro DNS necesita ese negocio.
            </p>
          )}
        </div>

        <div className="rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-brand-wine">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Verificacion y SSL</p>
          </div>

          <div className="mt-3 grid gap-3">
            <RuleLine
              label="Estrategia SSL"
              value={overview?.sslStrategy || "No definida"}
              copy="La emision del certificado no vive dentro del backend; la infraestructura lo resuelve cuando el dominio ya apunta correctamente."
            />
            <RuleLine
              label="Estado del dominio publico"
              value={primaryDomain ? formatDomainStatus(primaryDomain.status) : "Pendiente"}
              copy={
                primaryDomain
                  ? primaryDomain.isPrimary
                    ? `Hoy el sitio publico principal sale por ${primaryDomain.hostname}.`
                    : "Todavia no hay un dominio principal definido."
                  : "Todavia no hay dominio publico principal listo."
              }
            />
            <RuleLine
              label="Dominio base de la plataforma"
              value={overview?.platformApexDomain || "Sin apex"}
              copy="Sirve como fallback tecnico y evita dejar al tenant sin una URL publica mientras cambia su dominio."
            />
          </div>

          {lastVerification ? (
            <div className="mt-4 rounded-[1rem] border border-rose-100 bg-rose-50/45 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-brand-wine">
                <Sparkles className="h-4 w-4" />
                <p className="font-semibold text-brand-ink">Ultima verificacion</p>
              </div>
              <p className="mt-2">{lastVerification.message}</p>
              <p className="mt-2">
                <strong className="text-brand-ink">CNAME detectados:</strong>{" "}
                {lastVerification.actualCnameRecords.length
                  ? lastVerification.actualCnameRecords.join(", ")
                  : "Ninguno"}
              </p>
              <p className="mt-1">
                <strong className="text-brand-ink">A detectados:</strong>{" "}
                {lastVerification.actualARecords.length
                  ? lastVerification.actualARecords.join(", ")
                  : "Ninguno"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface DomainCardProps {
  title: string;
  copy: string;
  domain: TenantDomain | null;
  emptyLabel?: string;
  actionLabel?: string | null;
  onAction?: () => void;
  isActionLoading?: boolean;
  secondaryActionLabel?: string | null;
  onSecondaryAction?: () => void;
  isSecondaryActionLoading?: boolean;
}

function DomainCard({
  title,
  copy,
  domain,
  emptyLabel = "Sin dominio cargado",
  actionLabel,
  onAction,
  isActionLoading = false,
  secondaryActionLabel,
  onSecondaryAction,
  isSecondaryActionLoading = false,
}: DomainCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
        </div>
        {domain?.isPrimary ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Principal
          </span>
        ) : null}
      </div>

      {domain ? (
        <>
          <div className="mt-4 rounded-[1rem] border border-rose-100 bg-rose-50/45 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="break-all font-semibold text-brand-ink">{domain.hostname}</p>
              <StatusBadge status={domain.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {formatDomainType(domain.type)}
              {domain.verifiedAt ? ` · verificado ${formatDate(domain.verifiedAt)}` : ""}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onSecondaryAction}
                disabled={isSecondaryActionLoading}
                className="min-w-44"
              >
                {isSecondaryActionLoading ? "Verificando..." : secondaryActionLabel}
              </Button>
            ) : null}

            {actionLabel && onAction ? (
              <Button
                type="button"
                onClick={onAction}
                disabled={isActionLoading}
                className="min-w-44"
              >
                {isActionLoading ? "Actualizando..." : actionLabel}
              </Button>
            ) : null}

            <a
              href={`https://${domain.hostname}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-5 text-sm font-extrabold text-brand-ink transition hover:border-brand-rose hover:text-brand-wine"
            >
              Abrir dominio
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-[1rem] border border-dashed border-rose-200 bg-rose-50/25 px-4 py-4 text-sm text-slate-500">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TenantDomainStatus }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "FAILED"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {formatDomainStatus(status)}
    </span>
  );
}

function RuleLine({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy: string;
}) {
  return (
    <div className="rounded-[1rem] border border-rose-100 bg-rose-50/35 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-brand-ink">{label}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-wine">
          {value}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{copy}</p>
    </div>
  );
}

function formatDomainType(type: TenantDomain["type"]): string {
  switch (type) {
    case "PLATFORM_SUBDOMAIN":
      return "Subdominio de plataforma";
    case "CUSTOM_ROOT":
      return "Dominio raiz custom";
    case "CUSTOM_SUBDOMAIN":
      return "Subdominio custom";
    default:
      return type;
  }
}

function formatDomainStatus(status: TenantDomainStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "FAILED":
      return "Con problema";
    case "PENDING":
      return "Pendiente";
    default:
      return status;
  }
}

function formatSetupMode(mode: TenantDomain["setup"]["mode"]): string {
  switch (mode) {
    case "A":
      return "Registro A";
    case "CNAME":
      return "CNAME";
    case "MANUAL":
      return "Config manual";
    default:
      return mode;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as AxiosError<ApiErrorResponse>;
  return apiError.response?.data?.message || fallback;
}
