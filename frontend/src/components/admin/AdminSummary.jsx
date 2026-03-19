export function AdminSummary({ items }) {
  return (
    <section className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {items.map((item) => (
        <article
          key={item.label}
          className="card-surface flex min-h-[124px] flex-col justify-between bg-white/82 p-4"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
          <p className="mt-4 font-sans text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-brand-wine">
            {item.value}
          </p>
          {item.copy ? <p className="mt-3 text-xs leading-5 text-slate-500">{item.copy}</p> : null}
        </article>
      ))}
    </section>
  );
}
