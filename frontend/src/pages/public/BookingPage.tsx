import { BookingForm } from "../../features/booking/components/BookingForm";
import { usePublicTenant } from "../../features/public/tenant/PublicTenantProvider";
import { SectionHeading } from "../../shared/ui/section-heading/SectionHeading";

export function BookingPage() {
  const { siteConfig } = usePublicTenant();

  return (
    <section className="py-6 md:py-8">
      <div className="container-shell">
        <SectionHeading
          title={`Reserva tu turno en ${siteConfig.businessName}`}
          copy="Estas reservando dentro del negocio correcto segun el dominio actual. Los servicios, la disponibilidad y los canales de contacto se cargan desde ese tenant."
        />
        <div className="mt-5 md:mt-6">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
