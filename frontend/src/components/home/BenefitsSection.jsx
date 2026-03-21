import { benefits } from "../../data/homeContent";
import { SectionHeading } from "../../shared/ui/section-heading/SectionHeading";

export function BenefitsSection() {
  return (
    <section className="py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Diferenciales"
          title="Una experiencia simple para pacientes y ordenada para la clinica"
          copy="La UI y la arquitectura se apoyan mutuamente: el sitio inspira confianza, mientras el sistema administra disponibilidad real y evita errores operativos."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map(({ title, copy, icon: Icon }) => (
            <article key={title} className="card-surface p-6">
              <div className="inline-flex rounded-2xl bg-rose-100 p-3 text-brand-wine">
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-brand-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
