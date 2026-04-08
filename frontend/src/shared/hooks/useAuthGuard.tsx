import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../../features/admin/auth/api/auth.api";
import { clearStoredToken, getStoredToken } from "../utils/auth";

interface AuthGuardProps {
  children: ReactNode;
}

type GuardStatus = "checking" | "authenticated" | "unauthenticated";

export function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<GuardStatus>("checking");

  useEffect(() => {
    let isCancelled = false;

    async function validateSession() {
      const token = getStoredToken();

      if (!token) {
        if (!isCancelled) {
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        await getMe();

        if (!isCancelled) {
          setStatus("authenticated");
        }
      } catch {
        clearStoredToken();

        if (!isCancelled) {
          setStatus("unauthenticated");
        }
      }
    }

    void validateSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <section className="flex min-h-screen items-center justify-center bg-hero-glow px-5 py-16">
        <div className="card-surface w-full max-w-md p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine">Admin</p>
          <h1 className="mt-4 font-display text-4xl text-brand-ink">Validando sesion</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Estamos comprobando que la cuenta pertenezca al negocio correcto segun el dominio actual.
          </p>
        </div>
      </section>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
