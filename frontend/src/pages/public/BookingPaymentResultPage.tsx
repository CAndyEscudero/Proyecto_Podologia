import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ReceiptText,
  RefreshCcw,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeading } from "../../shared/ui/section-heading/SectionHeading";
import { Button } from "../../shared/ui/button/Button";
import { siteConfig } from "../../app/config/site-config";
import type { BookingPaymentStatusCopy } from "../../features/booking/types/booking.types";

const statusMap: Record<string, BookingPaymentStatusCopy> = {
  success: {
    title: "Reserva confirmada",
    description:
      "Recibimos tu pago correctamente y tu reserva quedo registrada. En breve podes revisar cualquier detalle desde el comprobante.",
    tone: "success",
  },
  pending: {
    title: "Pago en revision",
    description:
      "Tu pago esta siendo procesado. No hace falta volver a reservar: cuando se confirme, tu turno seguira asociado a esta misma operacion.",
    tone: "warning",
  },
  failure: {
    title: "No pudimos confirmar el pago",
    description:
      "La operacion no se aprobo. Si queres, podes volver a intentar la reserva o escribirnos para ayudarte.",
    tone: "danger",
  },
};

function resolvePaymentStatus(searchParams: URLSearchParams): string {
  const status = searchParams.get("status");
  const collectionStatus = searchParams.get("collection_status");

  if (status === "approved" || collectionStatus === "approved") {
    return "success";
  }

  if (status === "pending" || collectionStatus === "pending" || collectionStatus === "in_process") {
    return "pending";
  }

  if (status === "failure" || status === "rejected" || collectionStatus === "rejected") {
    return "failure";
  }

  return status || collectionStatus || "pending";
}

function parseAppointmentCode(reference: string | null): string | null {
  if (!reference) {
    return null;
  }

  const [, appointmentId] = reference.split(":");
  return appointmentId || reference;
}

function formatMercadoPagoStatus(value: string | null): string {
  if (!value) {
    return "En proceso";
  }

  const labels: Record<string, string> = {
    approved: "Aprobado",
    pending: "Pendiente",
    in_process: "En revision",
    rejected: "Rechazado",
    failure: "Fallido",
  };

  return labels[value] || value;
}

export function BookingPaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = resolvePaymentStatus(searchParams);
  const copy = useMemo(() => statusMap[status] || statusMap.pending, [status]);

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const paymentStatus = searchParams.get("collection_status") || searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const externalReference = searchParams.get("external_reference");
  const appointmentCode = parseAppointmentCode(externalReference);

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

  const receiptLines = [
    `Comprobante de reserva - ${siteConfig.businessName}`,
    `Estado: ${copy.title}`,
    appointmentCode ? `Reserva: #${appointmentCode}` : null,
    paymentId ? `Pago: ${paymentId}` : null,
    merchantOrderId ? `Operacion: ${merchantOrderId}` : null,
    `Estado del pago: ${formatMercadoPagoStatus(paymentStatus)}`,
    `Contacto: ${siteConfig.phone}`,
    `Direccion: ${siteConfig.address}`,
  ].filter(Boolean);

  async function handleShareReceipt() {
    const shareText = receiptLines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reserva - ${siteConfig.businessName}`,
          text: shareText,
        });
        return;
      } catch {
        // Let it fall back to clipboard when user cancels or share is unavailable.
      }
    }

    await navigator.clipboard.writeText(shareText);
    toast.success("Comprobante copiado para compartir.");
  }

  function handleDownloadReceipt() {
    const file = new Blob([receiptLines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `reserva-${appointmentCode || paymentId || "comprobante"}.txt`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container-shell">
        <SectionHeading title="Estado de tu reserva" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="card-surface overflow-hidden bg-white/95 p-6 md:p-8">
            <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses}`}>
              {icon}
              {copy.title}
            </div>

            <div className="mt-6 space-y-4 text-slate-600">
              <p className="text-base leading-7">{copy.description}</p>
              <p className="text-sm leading-6">
                Guarda este comprobante para tener a mano el numero de la reserva y el identificador del pago.
              </p>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-rose-100 bg-rose-50/35 p-5">
              <div className="flex items-center gap-3 text-brand-wine">
                <ReceiptText className="h-5 w-5" />
                <p className="text-sm font-extrabold uppercase tracking-[0.18em]">Comprobante de reserva</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ResultRow label="Reserva" value={appointmentCode ? `#${appointmentCode}` : "Se generara al confirmar"} />
                <ResultRow label="Pago" value={paymentId || "Pendiente de referencia"} />
                <ResultRow label="Operacion" value={merchantOrderId || "Sin numero"} />
                <ResultRow label="Estado" value={formatMercadoPagoStatus(paymentStatus)} />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => void handleShareReceipt()}>
                <Share2 size={16} />
                Compartir comprobante
              </Button>
              <Button variant="secondary" className="gap-2" onClick={handleDownloadReceipt}>
                <Download size={16} />
                Descargar comprobante
              </Button>
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
              Informacion util
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Si necesitas ayuda con tu turno, escribinos y comparti el comprobante para ubicar la reserva mas rapido.</p>
              <p>Si el pago quedo en revision, no hace falta reservar de nuevo inmediatamente.</p>
              <p>
                Contacto: <span className="font-semibold text-brand-ink">{siteConfig.phone}</span>
              </p>
              <p>
                Direccion: <span className="font-semibold text-brand-ink">{siteConfig.address}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white bg-white/85 px-4 py-3 shadow-[0_16px_40px_-34px_rgba(90,64,74,0.22)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
