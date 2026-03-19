import { siteConfig } from "../../app/siteConfig";
import { buildWhatsAppUrl } from "../../utils/whatsapp";
import { Button } from "../ui/Button";
import { SectionHeading } from "../ui/SectionHeading";

export function ContactSection() {
  return (
    <section className="py-20">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface p-8">
          <SectionHeading
            align="left"
            eyebrow="Contacto"
            title="Reserva tu turno y hace tu consulta"
            copy="El flujo principal pasa por reserva online, pero el canal humano sigue estando disponible para acompañar cada caso."
          />
          <div className="mt-8 space-y-4 text-slate-600">
            <p><strong className="text-brand-ink">Direccion:</strong> {siteConfig.address}</p>
            <p><strong className="text-brand-ink">Telefono:</strong> {siteConfig.phone}</p>
            <p><strong className="text-brand-ink">Horarios:</strong> Lunes a viernes de 09:00 a 18:00 hs.</p>
          </div>
          <a href={buildWhatsAppUrl("Hola! Quiero hacer una consulta sobre turnos.")} target="_blank" rel="noreferrer" className="mt-8 inline-block">
            <Button>Hablar por WhatsApp</Button>
          </a>
        </div>
        <div className="card-surface overflow-hidden">
          <iframe
            title="Ubicacion del centro"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13247.904832538965!2d-61.9675!3d-33.7456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95c76742a0337f97%3A0xc3f173d1f03d5248!2sVenado%20Tuerto%2C%20Santa%20Fe!5e0!3m2!1ses!2sar!4v1710000000000!5m2!1ses!2sar"
            className="min-h-[460px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
