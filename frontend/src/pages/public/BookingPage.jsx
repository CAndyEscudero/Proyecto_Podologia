import { BookingForm } from "../../components/booking/BookingForm";
import { SectionHeading } from "../../components/ui/SectionHeading";

export function BookingPage() {
  return (
    <section className="py-10 md:py-12">
      <div className="container-shell">
        <SectionHeading
          title="Reserva tu turno online"
          copy="La interfaz prioriza simplicidad para el paciente y consistencia operativa para la clinica."
        />
        <div className="mt-8 md:mt-9">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
