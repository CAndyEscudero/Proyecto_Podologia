import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  ChevronRight,
  Clock3,
  LogOut,
  PlusSquare,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import type { AdminNavigationItem } from "../types/navigation.types";

const icons: Record<string, LucideIcon> = {
  appointments: CalendarRange,
  appointmentCreate: PlusSquare,
  appointmentManage: ChevronRight,
  services: BriefcaseBusiness,
  availability: Clock3,
  business: Settings2,
};

interface AdminSidebarProps {
  items: AdminNavigationItem[];
  activeTab: string;
  onChange: (nextTab: string) => void;
  userName?: string;
  businessName?: string;
  tenantHost?: string;
  onLogout?: () => void;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  items,
  activeTab,
  onChange,
  userName,
  businessName,
  tenantHost,
  onLogout,
  className,
  showCloseButton = false,
  onClose,
}: AdminSidebarProps) {
  return (
    <aside className={clsx("space-y-3", className)}>
      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/94 p-3 shadow-[0_18px_36px_-34px_rgba(90,64,74,0.22)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-1 pb-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
              Panel
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-ink">Navegacion principal</p>
          </div>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-rose hover:text-brand-wine"
              aria-label="Cerrar menu"
            >
              <X size={17} />
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-1">
          {items.map((item) => {
            const Icon = icons[item.id];
            const isParentActive =
              item.children?.some((child) => child.id === activeTab) || activeTab === item.id;

            return (
              <div key={item.id} className="space-y-1.5">
                <button
                  type="button"
                  aria-pressed={isParentActive}
                  onClick={() => {
                    onChange(item.defaultChildId || item.id);
                    onClose?.();
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-[1rem] border px-3 py-2.5 text-left transition",
                    isParentActive
                      ? "border-rose-100 bg-rose-50/60 text-brand-ink shadow-[0_10px_24px_-22px_rgba(148,100,114,0.3)]"
                      : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50/80"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={clsx(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        isParentActive ? "bg-brand-wine text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.label}</p>
                      {item.copy ? (
                        <p className="truncate text-xs text-slate-500">{item.copy}</p>
                      ) : null}
                    </div>
                  </div>
                  {item.badge ? (
                    <span
                      className={clsx(
                        "min-w-[2rem] rounded-full px-2 py-1 text-center text-[11px] font-bold",
                        isParentActive ? "bg-white text-brand-wine" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>

                {item.children?.length && isParentActive ? (
                  <div className="space-y-1 pl-2">
                    {item.children.map((child) => {
                      const ChildIcon = icons[child.id];
                      const isChildActive = activeTab === child.id;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            onChange(child.id);
                            onClose?.();
                          }}
                          className={clsx(
                            "flex w-full items-center justify-between rounded-[0.95rem] border px-3 py-2.5 text-left transition",
                            isChildActive
                              ? "border-rose-100 bg-white text-brand-ink shadow-[0_10px_24px_-22px_rgba(148,100,114,0.24)]"
                              : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50/80 hover:text-brand-ink"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={clsx(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                isChildActive ? "bg-rose-50 text-brand-wine" : "bg-white text-slate-400"
                              )}
                            >
                              <ChildIcon size={14} />
                            </span>
                            <span className="text-sm font-medium">{child.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3.5 border-t border-slate-100 pt-3.5">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-wine shadow-sm">
                <UserRound size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-ink">
                  {userName || "Cargando usuario..."}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Building2 size={12} className="shrink-0 text-slate-400" />
                  <span className="truncate">{businessName || "Negocio sin configurar"}</span>
                </div>
                {tenantHost ? (
                  <p className="mt-1 truncate text-[11px] text-slate-400">{tenantHost}</p>
                ) : null}
              </div>
            </div>
          </div>

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:border-brand-rose hover:text-brand-wine"
            >
              <LogOut size={15} />
              Cerrar sesion
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
