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
      <div className="card-surface bg-white/92 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-wine">Navegacion</p>
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

        <div className="mt-4 space-y-2">
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
                    "flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-3 text-left transition",
                    isParentActive
                      ? "border-brand-rose bg-rose-50 text-brand-ink shadow-soft"
                      : "border-transparent bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/60"
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
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-wine">
                      {item.badge}
                    </span>
                  ) : null}
                </button>

                {item.children?.length && isParentActive ? (
                  <div className="space-y-1 pl-3">
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
                            "flex w-full items-center justify-between rounded-[1.1rem] border px-3 py-2.5 text-left transition",
                            isChildActive
                              ? "border-brand-rose bg-white text-brand-ink"
                              : "border-transparent bg-transparent text-slate-500 hover:border-rose-200 hover:bg-white/70 hover:text-brand-ink"
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
