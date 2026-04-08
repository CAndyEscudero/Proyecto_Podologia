import { testimonials } from "../data/home-content";
import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";
import { usePublicTenant } from "../../public/tenant/PublicTenantProvider";

export function TestimonialsSection() {
  const { siteConfig } = usePublicTenant();

  return (
    <section className="py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Testimonios"
          title={`Lo que valoran quienes reservan en ${siteConfig.businessName}`}
          copy="Estos testimonios funcionan como prueba social generica mientras dejamos la base lista para personalizacion mas profunda por tenant."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.author} className="card-surface p-6">
              <p className="text-base leading-7 text-slate-600">"{testimonial.quote}"</p>
              <strong className="mt-6 block text-brand-wine">{testimonial.author}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
