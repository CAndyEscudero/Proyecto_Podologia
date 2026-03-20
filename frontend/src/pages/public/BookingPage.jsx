import { BookingForm } from "../../components/booking/BookingForm";
import { SectionHeading } from "../../components/ui/SectionHeading";

export function BookingPage() {
  return (
    <section className="py-6 md:py-8">
      <div className="container-shell">
        <SectionHeading title="Reserva tu turno online" />
        <div className="mt-5 md:mt-6">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
