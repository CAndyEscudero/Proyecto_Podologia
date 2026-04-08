import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";
import { usePublicTenant } from "../../public/tenant/PublicTenantProvider";

export function AboutSection() {
  const { siteConfig } = usePublicTenant();

  return (
    <section className="py-20">
      <div className="container-shell grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <SectionHeading
            align="left"
            eyebrow="Sobre el negocio"
            title={`Una experiencia clara, profesional y alineada con ${siteConfig.businessName}`}
            copy="El frente publico combina cercania comercial con una agenda ordenada para que cada negocio muestre mejor su propuesta y opere sin fricciones."
          />
          <p className="section-copy">
            Esta etapa deja la home preparada para mostrar la identidad del tenant correcto segun el
            dominio actual, sin mezclar datos, servicios ni canales con otros negocios de la
            plataforma.
          </p>
          <p className="section-copy">
            La personalizacion visual profunda puede crecer despues, pero ya tenemos resuelto lo
            esencial: nombre, contacto, servicios y reservas cargados desde la configuracion del
            negocio activo.
          </p>
        </div>
        <div className="card-surface overflow-hidden">
          <img
            src="/images/Gemini_Generated_Image_fdx4jjfdx4jjfdx4.webp"
            alt={`Espacio de trabajo de ${siteConfig.businessName}`}
            className="h-full min-h-[420px] w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
