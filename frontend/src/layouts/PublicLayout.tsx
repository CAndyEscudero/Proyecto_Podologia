import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { WhatsAppFloat } from "../components/layout/WhatsAppFloat";
import { PublicTenantProvider, usePublicTenant } from "../features/public/tenant/PublicTenantProvider";
import type { TenantAccessIssue } from "../shared/utils/tenant-access";

export function PublicLayout() {
  return (
    <PublicTenantProvider>
      <PublicLayoutShell />
    </PublicTenantProvider>
  );
}

function PublicLayoutShell() {
  const location = useLocation();
  const { isLoading, hasResolved, errorMessage, tenantIssue, publicSettings } = usePublicTenant();
  const [isRedirectingToPrimaryDomain, setIsRedirectingToPrimaryDomain] = useState(false);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
      return;
    }

    const headerOffset = 104;
    const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(elementTop - headerOffset, 0),
      behavior: "smooth",
    });
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isLocalHostname(window.location.hostname) ||
      !publicSettings?.shouldRedirectToPreferredDomain ||
      !publicSettings.primaryPublicHostname
    ) {
      return;
    }

    const nextUrl = buildPreferredDomainUrl(publicSettings.primaryPublicHostname);

    if (!nextUrl || nextUrl === window.location.href) {
      return;
    }

    setIsRedirectingToPrimaryDomain(true);
    window.location.replace(nextUrl);
  }, [
    publicSettings?.primaryPublicHostname,
    publicSettings?.shouldRedirectToPreferredDomain,
    location.hash,
    location.pathname,
    location.search,
  ]);

  if (isLoading && !hasResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fffdfd,#f9f2f4)] px-6">
        <div className="max-w-md rounded-[2rem] border border-rose-100 bg-white/90 px-8 py-10 text-center shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brand-wine">
            Resolviendo negocio
          </p>
          <h1 className="mt-3 font-display text-4xl text-brand-ink">Cargando experiencia publica</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Estamos identificando la configuracion del negocio para mostrar sus datos, servicios y
            canales correctos.
          </p>
        </div>
      </div>
    );
  }

  if (isRedirectingToPrimaryDomain) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fffdfd,#f9f2f4)] px-6">
        <div className="max-w-md rounded-[2rem] border border-rose-100 bg-white/90 px-8 py-10 text-center shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brand-wine">
            Redireccionando
          </p>
          <h1 className="mt-3 font-display text-4xl text-brand-ink">Te llevamos al dominio principal</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Este negocio ya tiene un dominio publico preferido. Estamos abriendo esa URL para mantener la experiencia consistente.
          </p>
        </div>
      </div>
    );
  }

  if (tenantIssue) {
    return <PublicTenantIssueState issue={tenantIssue} />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      {errorMessage ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}
      <main>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function buildPreferredDomainUrl(hostname: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedHostname = hostname.trim().toLowerCase();

  if (!normalizedHostname) {
    return null;
  }

  const shouldKeepPort =
    isLocalHostname(normalizedHostname);
  const port = shouldKeepPort && window.location.port ? `:${window.location.port}` : "";

  return `${window.location.protocol}//${normalizedHostname}${port}${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

function PublicTenantIssueState({ issue }: { issue: TenantAccessIssue }) {
  const toneClasses =
    issue.tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-amber-200 bg-amber-50 text-amber-900";

  const badgeClasses =
    issue.tone === "danger" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fffdfd,#f9f2f4)] px-6">
      <div className={`max-w-2xl rounded-[2rem] border px-8 py-10 shadow-soft ${toneClasses}`}>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] ${badgeClasses}`}>
          Estado del tenant
        </span>
        <h1 className="mt-4 font-display text-4xl text-brand-ink">{issue.title}</h1>
        <p className="mt-4 text-sm leading-7">{issue.description}</p>
        <p className="mt-4 text-sm leading-7">{issue.actionHint}</p>
        <div className="mt-6 rounded-[1.2rem] border border-white/70 bg-white/70 px-4 py-4 text-sm text-slate-600">
          <p className="font-semibold text-brand-ink">Host detectado</p>
          <p className="mt-1 break-all">{issue.requestedHost}</p>
        </div>
      </div>
    </div>
  );
}
