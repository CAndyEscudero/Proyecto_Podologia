import { faqs } from "../data/home-content";
import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";
import { usePublicTenant } from "../../public/tenant/PublicTenantProvider";

export function FaqSection() {
  const { siteConfig } = usePublicTenant();

  return (
    <section id="faq" className="py-20">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title={`Respuestas claras antes de reservar en ${siteConfig.businessName}`}
          copy="Estas preguntas quedan en tono general para que la home sirva tanto para peluquerias como para esteticas, centros de bienestar u otros negocios por turno."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="card-surface p-6">
              <h3 className="text-lg font-bold text-brand-ink">{faq.question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
