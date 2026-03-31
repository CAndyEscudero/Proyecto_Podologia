import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarClock, ChartColumn, GripVertical, UsersRound } from "lucide-react";
import type { AdminSummaryItem } from "../types/appointments.types";

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

    const savedLabels = window.localStorage.getItem(STORAGE_KEY);
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

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orderedLabels));
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
    <section className="grid auto-rows-fr gap-2 md:grid-cols-2 2xl:grid-cols-4">
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
            className={`flex min-h-[90px] min-w-0 flex-col justify-between rounded-[1.05rem] border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_10px_22px_-20px_rgba(148,100,114,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_-22px_rgba(148,100,114,0.24)] md:min-h-[96px] md:px-3.5 ${
              isDragging ? "scale-[0.985] opacity-70" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1.5 font-sans text-[1.55rem] font-semibold leading-none tracking-tight tabular-nums text-brand-ink md:text-[1.65rem]">
                  {item.value}
                </p>
              </div>
              <div className="flex items-start gap-1.5">
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
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[0.8rem] border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-brand-wine"
                >
                  <GripVertical size={14} />
                </button>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] bg-rose-50 text-brand-wine md:h-9 md:w-9">
                  <Icon size={16} />
                </span>
              </div>
            </div>
            {item.copy ? (
              <p className="mt-1.5 min-h-[2rem] max-w-[20ch] text-[0.9rem] leading-5 text-slate-500">
                {item.copy}
              </p>
            ) : (
              <div className="mt-1.5 min-h-[2rem]" />
            )}
          </article>
        );
      })}
    </section>
  );
}
