import { buildWhatsAppUrl } from "../../../shared/utils/whatsapp";
import { Button } from "../../../shared/ui/button/Button";
import { SectionHeading } from "../../../shared/ui/section-heading/SectionHeading";
import { usePublicTenant } from "../../public/tenant/PublicTenantProvider";

export function ContactSection() {
  const { siteConfig } = usePublicTenant();
  const whatsAppUrl =
    siteConfig.whatsappEnabled
      ? buildWhatsAppUrl(
          siteConfig.whatsappDefaultMessage || "Hola! Quiero hacer una consulta sobre turnos.",
          siteConfig.whatsappNumber
        )
      : null;

  return (
    <section className="py-20">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface p-8">
          <SectionHeading
            align="left"
            eyebrow="Contacto"
            title={`Reserva online y contacto directo con ${siteConfig.businessName}`}
            copy="El flujo principal pasa por reserva online, pero el canal humano del negocio sigue disponible para acompanarte cuando haga falta."
          />
          <div className="mt-8 space-y-4 text-slate-600">
            <p>
              <strong className="text-brand-ink">Direccion:</strong> {siteConfig.address}
            </p>
            <p>
              <strong className="text-brand-ink">Telefono:</strong> {siteConfig.phone}
            </p>
            {siteConfig.contactEmail ? (
              <p>
                <strong className="text-brand-ink">Email:</strong> {siteConfig.contactEmail}
              </p>
            ) : null}
            <p>
              <strong className="text-brand-ink">Reservas:</strong> selecciona servicio, fecha y
              horario desde la agenda online.
            </p>
          </div>

          {whatsAppUrl ? (
            <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="mt-8 inline-block">
              <Button>Hablar por WhatsApp</Button>
            </a>
          ) : null}
        </div>

        <div className="card-surface overflow-hidden">
          <div className="flex min-h-[460px] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(249,228,234,0.85),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,244,246,0.96))] p-8 text-center">
            <div className="max-w-md">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-brand-wine">
                Datos del negocio
              </p>
              <h3 className="mt-3 font-display text-4xl text-brand-ink">{siteConfig.businessName}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                En esta fase dejamos el frente publico preparado para mostrar la identidad correcta
                del tenant. La personalizacion visual mas profunda del negocio sigue en la siguiente
                etapa.
              </p>
              <div className="mt-6 rounded-[1.35rem] border border-rose-100 bg-white/80 px-5 py-4 text-left text-sm text-slate-600 shadow-soft">
                <p>
                  <strong className="text-brand-ink">Direccion:</strong> {siteConfig.address}
                </p>
                <p className="mt-2">
                  <strong className="text-brand-ink">Telefono:</strong> {siteConfig.phone}
                </p>
                {siteConfig.contactEmail ? (
                  <p className="mt-2">
                    <strong className="text-brand-ink">Email:</strong> {siteConfig.contactEmail}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
