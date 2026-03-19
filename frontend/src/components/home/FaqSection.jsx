import { faqs } from "../../data/homeContent";
import { SectionHeading } from "../ui/SectionHeading";

export function FaqSection() {
  return (
    <section id="faq" className="py-20">
      <div className="container-shell">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Respuestas claras antes de reservar" />
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
