import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCcw } from "lucide-react";
import { SectionHeading } from "../../shared/ui/section-heading/SectionHeading";
import { Button } from "../../shared/ui/button/Button";
import type { BookingPaymentStatusCopy } from "../../features/booking/types/booking.types";

const statusMap: Record<string, BookingPaymentStatusCopy> = {
  success: {
    title: "Pago recibido correctamente",
    description:
      "Tu pago fue procesado. En breve vamos a validar la confirmacion final de la reserva.",
    tone: "success",
  },
  pending: {
    title: "Pago pendiente de confirmacion",
    description:
      "Mercado Pago todavia esta procesando la operacion. Cuando el pago se apruebe, la reserva quedara confirmada.",
    tone: "warning",
  },
  failure: {
    title: "No pudimos confirmar el pago",
    description:
      "La operacion no se aprobo. Podes volver a intentar la reserva o contactarnos si necesitas ayuda.",
    tone: "danger",
  },
};

export function BookingPaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "pending";
  const copy = useMemo(() => statusMap[status] || statusMap.pending, [status]);

  const icon =
    copy.tone === "success" ? (
      <CheckCircle2 className="h-6 w-6" />
    ) : copy.tone === "warning" ? (
      <Clock3 className="h-6 w-6" />
    ) : (
      <AlertTriangle className="h-6 w-6" />
    );

  const toneClasses =
    copy.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : copy.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <section className="py-6 md:py-8">
      <div className="container-shell">
        <SectionHeading title="Estado de tu reserva" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card-surface overflow-hidden bg-white/95 p-6 md:p-8">
            <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses}`}>
              {icon}
              {copy.title}
            </div>

            <div className="mt-6 space-y-4 text-slate-600">
              <p className="text-base leading-7">{copy.description}</p>
              <p className="text-sm leading-6">
                Recorda que el turno se confirma definitivamente cuando el backend recibe la validacion del pago.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/reservas">
                <Button className="gap-2">
                  <RefreshCcw size={16} />
                  Volver a reservar
                </Button>
              </Link>
              <Link to="/">
                <Button variant="secondary">Ir al inicio</Button>
              </Link>
            </div>
          </div>

          <aside className="card-surface p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
              Importante
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Si el pago queda pendiente, no hace falta reservar de nuevo inmediatamente.</p>
              <p>Si el pago falla, el horario no deberia quedar confirmado automaticamente.</p>
              <p>Ante cualquier duda, podes escribirnos por WhatsApp para ayudarte con la reserva.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
