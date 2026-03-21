import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarRange,
  ChevronRight,
  Clock3,
  PlusSquare,
  Settings2,
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
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  items,
  activeTab,
  onChange,
  className,
  showCloseButton = false,
  onClose,
}: AdminSidebarProps) {
  return (
    <aside className={clsx("space-y-4", className)}>
      <div className="rounded-[1.85rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,247,0.96))] p-4 shadow-[0_22px_50px_-36px_rgba(90,64,74,0.38)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-brand-wine">Navegacion</p>
            <p className="mt-1 text-sm text-slate-500">Panel operativo</p>
          </div>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-slate-500 transition hover:border-brand-rose hover:text-brand-wine"
              aria-label="Cerrar menu"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 space-y-2.5">
          {items.map((item) => {
            const Icon = icons[item.id];
            const isParentActive = item.children?.some((child) => child.id === activeTab) || activeTab === item.id;

            return (
              <div key={item.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.defaultChildId || item.id);
                    onClose?.();
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-3.5 text-left transition",
                    isParentActive
                      ? "border-rose-200 bg-gradient-to-r from-rose-50 to-white text-brand-ink shadow-[0_18px_34px_-28px_rgba(148,100,114,0.55)]"
                      : "border-transparent bg-white/75 text-slate-600 hover:border-rose-200 hover:bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        isParentActive ? "bg-brand-wine text-white" : "bg-rose-50 text-brand-wine"
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.copy}</p>
                    </div>
                  </div>
                  {item.badge ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-brand-wine shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </button>

                {item.children?.length && isParentActive ? (
                  <div className="space-y-1.5 pl-3">
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
                            "flex w-full items-center justify-between rounded-[1.15rem] border px-3 py-2.5 text-left transition",
                            isChildActive
                              ? "border-rose-200 bg-white text-brand-ink shadow-[0_12px_24px_-24px_rgba(148,100,114,0.55)]"
                              : "border-transparent bg-transparent text-slate-500 hover:border-rose-200 hover:bg-white/80 hover:text-brand-ink"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={clsx(
                                "flex h-8 w-8 items-center justify-center rounded-full",
                                isChildActive ? "bg-rose-50 text-brand-wine" : "bg-white text-slate-400"
                              )}
                            >
                              <ChildIcon size={15} />
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
      </div>
    </aside>
  );
}
