import { testimonials } from "../data/home-content";
import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container-shell">
        <SectionHeading eyebrow="Testimonios" title="Lo que valoran las pacientes" />
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
