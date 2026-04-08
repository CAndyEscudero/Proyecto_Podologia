import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarClock, ChartColumn, GripVertical, UsersRound } from "lucide-react";
import type { AdminSummaryItem } from "../types/appointments.types";
import { buildTenantStorageKey } from "../../../../shared/utils/tenant-storage";

interface AdminSummaryProps {
  items: AdminSummaryItem[];
}

const STORAGE_KEY = "admin-dashboard-summary-order";
const summaryIcons = [CalendarClock, Activity, ChartColumn, UsersRound];

export function AdminSummary({ items }: AdminSummaryProps) {
  const visibleItems = useMemo(() => items.slice(0, 4), [items]);
  const itemMap = useMemo(
    () => new Map(visibleItems.map((item, index) => [item.label, { item, index }])),
    [visibleItems]
  );
  const [orderedLabels, setOrderedLabels] = useState<string[]>(() => visibleItems.map((item) => item.label));
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);

    const savedLabels = window.localStorage.getItem(buildTenantStorageKey(STORAGE_KEY));
    if (!savedLabels) {
      setOrderedLabels(visibleItems.map((item) => item.label));
      return;
    }

    try {
      const parsedLabels = JSON.parse(savedLabels) as string[];
      const nextLabels = [
        ...parsedLabels.filter((label) => itemMap.has(label)),
        ...visibleItems.map((item) => item.label).filter((label) => !parsedLabels.includes(label)),
      ];

      setOrderedLabels(nextLabels);
    } catch {
      setOrderedLabels(visibleItems.map((item) => item.label));
    }
  }, [itemMap, visibleItems]);

  useEffect(() => {
    if (typeof window === "undefined" || !orderedLabels.length) {
      return;
    }

    window.localStorage.setItem(buildTenantStorageKey(STORAGE_KEY), JSON.stringify(orderedLabels));
  }, [orderedLabels]);

  const orderedItems = orderedLabels
    .map((label) => itemMap.get(label))
    .filter((entry): entry is { item: AdminSummaryItem; index: number } => Boolean(entry));

  function reorderItems(sourceLabel: string, targetLabel: string) {
    if (sourceLabel === targetLabel) {
      return;
    }

    setOrderedLabels((currentLabels) => {
      const sourceIndex = currentLabels.indexOf(sourceLabel);
      const targetIndex = currentLabels.indexOf(targetLabel);

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentLabels;
      }

      const nextLabels = [...currentLabels];
      const [movedLabel] = nextLabels.splice(sourceIndex, 1);
      nextLabels.splice(targetIndex, 0, movedLabel);
      return nextLabels;
    });
  }

  return (
    <section className="grid auto-rows-fr gap-3 lg:grid-cols-2 2xl:grid-cols-4">
      {orderedItems.map(({ item, index }) => {
        const Icon = summaryIcons[index] || Activity;
        const isDragging = draggedLabel === item.label;

        return (
          <article
            key={item.label}
            draggable
            onDragStart={() => setDraggedLabel(item.label)}
            onDragEnd={() => setDraggedLabel(null)}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={() => {
              if (draggedLabel) {
                reorderItems(draggedLabel, item.label);
              }
              setDraggedLabel(null);
            }}
            className={`flex min-h-[128px] min-w-0 flex-col justify-between rounded-[1.7rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_16px_40px_-28px_rgba(148,100,114,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(148,100,114,0.42)] md:px-5 ${
              isDragging ? "scale-[0.985] opacity-70" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-4 font-sans text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-brand-ink">
                  {item.value}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  draggable
                  aria-label={`Reordenar tarjeta ${item.label}`}
                  title="Arrastrar para reordenar"
                  onDragStart={(event) => {
                    event.stopPropagation();
                    setDraggedLabel(item.label);
                  }}
                  onDragEnd={() => setDraggedLabel(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-brand-wine"
                >
                  <GripVertical size={16} />
                </button>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-brand-wine">
                  <Icon size={18} />
                </span>
              </div>
            </div>
            {item.copy ? (
              <p className="mt-4 min-h-[2.8rem] max-w-[24ch] text-sm leading-6 text-slate-500">
                {item.copy}
              </p>
            ) : (
              <div className="mt-4 min-h-[2.8rem]" />
            )}
          </article>
        );
      })}
    </section>
  );
}
