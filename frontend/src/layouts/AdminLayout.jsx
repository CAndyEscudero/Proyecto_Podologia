import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearStoredToken } from "../utils/auth";
import { getBusinessSettings, getMe } from "../services/adminApi";

export function AdminLayout() {
  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    async function loadHeaderContext() {
      try {
        const [meResponse, businessSettingsResponse] = await Promise.all([
          getMe(),
          getBusinessSettings(),
        ]);
        setUserName(meResponse?.user?.fullName || "");
        setBusinessName(businessSettingsResponse?.businessName || "");
      } catch {
        setUserName("");
        setBusinessName("");
      }
    }

    loadHeaderContext();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-admin-shell">
      <header className="border-b border-rose-100/80 bg-white/88 backdrop-blur">
        <div className="admin-shell-container flex min-h-24 flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brand-wine">Centro de control</p>
            <p className="mt-2 font-display text-3xl text-brand-ink md:text-4xl">Panel administrativo</p>
            <p className="mt-1 text-sm text-slate-500">Agenda, servicios, disponibilidad y configuracion operativa</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="rounded-[1.35rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-soft">
              <p>
                <strong className="text-brand-ink">Usuario:</strong> {userName || "Cargando..."}
              </p>
              <p className="mt-1">
                <strong className="text-brand-ink">Negocio:</strong> {businessName || "Sin configurar"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearStoredToken();
                window.location.href = "/admin/login";
              }}
              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-brand-ink transition hover:border-brand-rose hover:text-brand-wine"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      <div className="admin-shell-container py-5 lg:py-6 xl:py-8">
        <Outlet />
      </div>
    </div>
  );
}
