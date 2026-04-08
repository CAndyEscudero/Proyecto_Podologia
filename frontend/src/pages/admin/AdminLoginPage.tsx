import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getMe, login } from "../../features/admin/auth/api/auth.api";
import { getPublicBusinessSettings } from "../../features/admin/business-settings/api/business-settings.api";
import type { LoginPayload } from "../../features/admin/auth/types/auth.types";
import { clearStoredToken, getStoredToken, setStoredToken } from "../../shared/utils/auth";
import { Button } from "../../shared/ui/button/Button";
import {
  buildAdminHostRequiredIssue,
  resolveTenantAccessIssue,
  type TenantAccessIssue,
} from "../../shared/utils/tenant-access";
import type { ApiErrorResponse } from "../../shared/types/api";

const loginSchema: z.ZodType<LoginPayload> = z.object({
  email: z.string().trim().min(6, "Email invalido").max(120, "Email invalido").email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres").max(72, "Maximo 72 caracteres"),
});

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState("Este negocio");
  const [tenantSupportCopy, setTenantSupportCopy] = useState(
    "Estamos resolviendo la identidad del negocio segun el dominio actual."
  );
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [tenantIssue, setTenantIssue] = useState<TenantAccessIssue | null>(null);
  const currentHost = useMemo(
    () => (typeof window !== "undefined" ? window.location.host : ""),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    let isCancelled = false;

    async function bootstrapLoginScreen() {
      try {
        const publicSettings = await getPublicBusinessSettings();

        if (!isCancelled) {
          if (publicSettings.currentDomainType && publicSettings.currentDomainType !== "PLATFORM_SUBDOMAIN") {
            const issue = buildAdminHostRequiredIssue({
              requestedHost: currentHost,
              adminHostname: publicSettings.adminHostname,
            });
            clearStoredToken();
            setTenantIssue(issue);
            setTenantName(issue.title);
            setTenantSupportCopy(issue.description);
            setIsCheckingSession(false);
            return;
          }

          setTenantIssue(null);
          const resolvedName = publicSettings.businessName || "Este negocio";
          setTenantName(resolvedName);
          setTenantSupportCopy(
            `Estas por ingresar al panel administrativo de ${resolvedName}. La sesion se valida contra el tenant resuelto por este dominio.`
          );
        }
      } catch (error) {
        if (!isCancelled) {
          const issue = resolveTenantAccessIssue(error, currentHost);
          clearStoredToken();
          setTenantIssue(issue);
          setTenantName(issue.title);
          setTenantSupportCopy(issue.description);
          setIsCheckingSession(false);
        }
        return;
      }

      const existingToken = getStoredToken();

      if (!existingToken) {
        if (!isCancelled) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        await getMe();

        if (!isCancelled) {
          void navigate("/admin/dashboard", { replace: true });
        }
      } catch {
        clearStoredToken();

        if (!isCancelled) {
          setIsCheckingSession(false);
        }
      }
    }

    void bootstrapLoginScreen();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  const onSubmit: SubmitHandler<LoginPayload> = async (values) => {
    try {
      const data = await login(values);
      setStoredToken(data.token);
      toast.success(`Sesion iniciada en ${data.tenant?.name || tenantName}`);
      void navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const message =
        apiError.response?.data?.message ||
        (error instanceof Error ? error.message : "No fue posible iniciar sesion");
      toast.error(message);
    }
  };

  const isLoginBlocked = Boolean(tenantIssue);
  const cardToneClasses = tenantIssue
    ? tenantIssue.tone === "danger"
      ? "border-rose-200 bg-rose-50/70"
      : "border-amber-200 bg-amber-50/70"
    : "border-rose-100 bg-rose-50/50";
  const eyebrowLabel = tenantIssue ? "Estado del acceso" : "Tenant actual";
  const buttonLabel = isLoginBlocked
    ? "Acceso no disponible"
    : isCheckingSession
      ? "Validando sesion..."
      : isSubmitting
        ? "Ingresando..."
        : "Ingresar";

  return (
    <section className="flex min-h-screen items-center justify-center bg-hero-glow px-5 py-16">
      <div className="card-surface w-full max-w-md p-8">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine">Admin</p>
        <h1 className="mt-4 font-display text-4xl text-brand-ink">Acceso al panel</h1>
        <div className={`mt-5 rounded-[1.4rem] border px-4 py-4 text-sm text-slate-600 ${cardToneClasses}`}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-wine">
            {eyebrowLabel}
          </p>
          <p className="mt-2 text-lg font-semibold text-brand-ink">{tenantName}</p>
          <p className="mt-1 break-all text-xs font-medium text-slate-500">{currentHost || "Host no disponible"}</p>
          <p className="mt-3 leading-6">{tenantSupportCopy}</p>
          {tenantIssue ? (
            <p className="mt-3 text-sm leading-6 text-brand-ink">{tenantIssue.actionHint}</p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Email</span>
            <input
              type="email"
              {...register("email")}
              className="field-input"
              placeholder="tu@email.com"
              disabled={isLoginBlocked || isCheckingSession}
            />
            {errors.email ? <span className="mt-2 block text-xs text-red-500">{errors.email.message}</span> : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Password</span>
            <input
              type="password"
              {...register("password")}
              className="field-input"
              placeholder="Tu password"
              disabled={isLoginBlocked || isCheckingSession}
            />
            {errors.password ? <span className="mt-2 block text-xs text-red-500">{errors.password.message}</span> : null}
          </label>
          <Button type="submit" className="w-full" disabled={isSubmitting || isCheckingSession || isLoginBlocked}>
            {buttonLabel}
          </Button>
        </form>
      </div>
    </section>
  );
}
