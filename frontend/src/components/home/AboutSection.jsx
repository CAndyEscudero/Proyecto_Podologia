import { SectionHeading } from "../../shared/ui/section-heading/SectionHeading";

export function AboutSection() {
  return (
    <section className="py-20">
      <div className="container-shell grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <SectionHeading
            align="left"
            eyebrow="Sobre la atencion"
            title="Atencion cercana, profesional y personalizada"
            copy="La propuesta mantiene la calidez del sitio actual, pero la ordena dentro de una experiencia mas confiable y preparada para crecer."
          />
          <p className="section-copy">
            Cada consulta se diseña para combinar cuidado clinico, estetica y una experiencia clara. El espacio, los mensajes y la navegacion buscan transmitir tranquilidad, higiene y criterio profesional.
          </p>
          <p className="section-copy">
            Esta base tambien prepara al negocio para vender el sistema a otras clinicas o profesionales independientes sin rehacer toda la estructura.
          </p>
        </div>
        <div className="card-surface overflow-hidden">
          <img src="/images/Gemini_Generated_Image_fdx4jjfdx4jjfdx4.webp" alt="Espacio de atencion en podologia" className="h-full min-h-[420px] w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
