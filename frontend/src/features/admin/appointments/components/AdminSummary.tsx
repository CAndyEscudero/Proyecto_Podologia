import type { AdminSummaryItem } from "../types/appointments.types";

interface AdminSummaryProps {
  items: AdminSummaryItem[];
}

export function AdminSummary({ items }: AdminSummaryProps) {
  return (
    <section className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="card-surface flex min-h-[152px] min-w-0 flex-col justify-between bg-white/82 p-4 md:p-5"
        >
          <div className="space-y-4">
            <p className="min-h-[2.6rem] text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <p className="font-sans text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-brand-wine">
              {item.value}
            </p>
          </div>
          {item.copy ? (
            <p className="mt-4 min-h-[2.8rem] text-sm leading-6 text-slate-500">
              {item.copy}
            </p>
          ) : (
            <div className="mt-4 min-h-[2.8rem]" />
          )}
        </article>
      ))}
    </section>
  );
}
