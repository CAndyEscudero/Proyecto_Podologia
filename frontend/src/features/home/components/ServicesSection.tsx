import { Link } from "react-router-dom";
import { services } from "../data/home-content";
import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";
import { Button } from "../../../shared/ui/button/Button";

export function ServicesSection() {
  return (
    <section id="servicios" className="py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Servicios"
          title="Tratamientos pensados para tu salud y bienestar"
          copy="La nueva experiencia combina imagen profesional, informacion clara y una logica de reserva preparada para operar de verdad."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article key={service.id} className="card-surface overflow-hidden">
              <img src={service.image} alt={service.name} className="h-60 w-full object-cover" />
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-brand-ink">{service.name}</h3>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-brand-wine">
                    {service.priceLabel}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-600">{service.description}</p>
                <Link
                  to={`/reservas?service=${encodeURIComponent(service.name)}`}
                  className="inline-flex"
                >
                  <Button className="w-full">Reservar este servicio</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
