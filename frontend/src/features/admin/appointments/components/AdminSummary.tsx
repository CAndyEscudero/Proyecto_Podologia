import { Activity, CalendarClock, ChartColumn, UsersRound } from "lucide-react";
import type { AdminSummaryItem } from "../types/appointments.types";

interface AdminSummaryProps {
  items: AdminSummaryItem[];
}

const summaryIcons = [CalendarClock, Activity, ChartColumn, UsersRound];

export function AdminSummary({ items }: AdminSummaryProps) {
  return (
    <section className="grid auto-rows-fr gap-3 lg:grid-cols-2 2xl:grid-cols-4">
      {items.slice(0, 4).map((item, index) => {
        const Icon = summaryIcons[index] || Activity;

        return (
        <article
          key={item.label}
          className="flex min-h-[128px] min-w-0 flex-col justify-between rounded-[1.7rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_16px_40px_-28px_rgba(148,100,114,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(148,100,114,0.42)] md:px-5"
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
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-brand-wine">
              <Icon size={18} />
            </span>
          </div>
          {item.copy ? (
            <p className="mt-4 min-h-[2.8rem] max-w-[24ch] text-sm leading-6 text-slate-500">
              {item.copy}
            </p>
          ) : (
            <div className="mt-4 min-h-[2.8rem]" />
          )}
        </article>
      )})}
    </section>
  );
}
