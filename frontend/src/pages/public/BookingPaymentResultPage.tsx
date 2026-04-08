import { useMemo } from "react";
import dayjs from "dayjs";
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
import { formatBookingPrice } from "../../features/booking/utils/booking-formatters";
import type { BookingPaymentStatusCopy } from "../../features/booking/types/booking.types";
import { usePublicTenant } from "../../features/public/tenant/PublicTenantProvider";

const BOOKING_RECEIPT_STORAGE_KEY = "booking_receipt_snapshot";

interface BookingReceiptSnapshot {
  appointmentId: number;
  issuedAt: string;
  appointment: {
    date: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
  };
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  service: {
    name: string;
    durationMin: number;
  };
  paymentSummary: {
    total: number | null;
    deposit: number | null;
    paymentOption?: string | null;
  };
}

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

function readReceiptSnapshot(): BookingReceiptSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(BOOKING_RECEIPT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as BookingReceiptSnapshot;
  } catch {
    return null;
  }
}

function toPdfSafeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .trim();
}

function buildSimplePdf(lines: Array<{ text: string; x: number; y: number; size?: number; bold?: boolean }>): Blob {
  const commands = [
    "BT",
    ...lines.map(({ text, x, y, size = 11, bold = false }) => {
      const font = bold ? "/F2" : "/F1";
      return `${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${toPdfSafeText(text)}) Tj`;
    }),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((objectContent, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function BookingPaymentResultPage() {
  const { siteConfig } = usePublicTenant();
  const [searchParams] = useSearchParams();
  const status = resolvePaymentStatus(searchParams);
  const copy = useMemo(() => statusMap[status] || statusMap.pending, [status]);
  const receiptSnapshot = useMemo(() => readReceiptSnapshot(), []);

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const paymentStatus = searchParams.get("collection_status") || searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const externalReference = searchParams.get("external_reference");
  const appointmentCode = parseAppointmentCode(externalReference);
  const issuedAtLabel = receiptSnapshot?.issuedAt ? dayjs(receiptSnapshot.issuedAt).format("DD/MM/YYYY HH:mm") : dayjs().format("DD/MM/YYYY HH:mm");
  const appointmentDateLabel = receiptSnapshot?.appointment.date
    ? dayjs(receiptSnapshot.appointment.date).format("DD/MM/YYYY")
    : "Pendiente";
  const clientFullName = receiptSnapshot
    ? `${receiptSnapshot.client.firstName} ${receiptSnapshot.client.lastName}`.trim()
    : "Paciente no disponible";

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
    receiptSnapshot?.service.name ? `Servicio: ${receiptSnapshot.service.name}` : null,
    receiptSnapshot ? `Paciente: ${clientFullName}` : null,
    receiptSnapshot ? `Telefono: ${receiptSnapshot.client.phone}` : null,
    receiptSnapshot?.client.email ? `Email: ${receiptSnapshot.client.email}` : null,
    receiptSnapshot ? `Fecha del turno: ${appointmentDateLabel}` : null,
    receiptSnapshot ? `Horario: ${receiptSnapshot.appointment.startTime} a ${receiptSnapshot.appointment.endTime}` : null,
    receiptSnapshot ? `Duracion: ${receiptSnapshot.service.durationMin} min` : null,
    receiptSnapshot ? `Importe total: ${formatBookingPrice(receiptSnapshot.paymentSummary.total)}` : null,
    receiptSnapshot ? `Sena abonada: ${formatBookingPrice(receiptSnapshot.paymentSummary.deposit)}` : null,
    receiptSnapshot ? `Emitido: ${issuedAtLabel}` : null,
    `Estado del pago: ${formatMercadoPagoStatus(paymentStatus)}`,
    receiptSnapshot?.appointment.notes ? `Observaciones: ${receiptSnapshot.appointment.notes}` : null,
    `Contacto: ${siteConfig.phone}`,
    siteConfig.contactEmail ? `Email de contacto: ${siteConfig.contactEmail}` : null,
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
    const pdfLines = [
      { text: siteConfig.businessName, x: 48, y: 790, size: 22, bold: true },
      { text: "Comprobante de reserva", x: 48, y: 762, size: 14, bold: true },
      { text: `Emitido: ${issuedAtLabel}`, x: 48, y: 742, size: 10 },
      { text: `Estado de la reserva: ${copy.title}`, x: 48, y: 712, size: 12, bold: true },
      { text: `Codigo de reserva: #${appointmentCode || receiptSnapshot?.appointmentId || "--"}`, x: 48, y: 690, size: 11 },
      { text: `ID de pago: ${paymentId || "Pendiente"}`, x: 48, y: 672, size: 11 },
      { text: `Operacion: ${merchantOrderId || "Sin numero"}`, x: 48, y: 654, size: 11 },
      { text: `Estado del pago: ${formatMercadoPagoStatus(paymentStatus)}`, x: 48, y: 636, size: 11 },
      { text: "Detalle del servicio", x: 48, y: 604, size: 12, bold: true },
      { text: `Servicio: ${receiptSnapshot?.service.name || "No disponible"}`, x: 48, y: 584, size: 11 },
      { text: `Fecha del turno: ${appointmentDateLabel}`, x: 48, y: 566, size: 11 },
      {
        text: `Horario: ${receiptSnapshot?.appointment.startTime || "--"} a ${receiptSnapshot?.appointment.endTime || "--"}`,
        x: 48,
        y: 548,
        size: 11,
      },
      { text: `Duracion: ${receiptSnapshot?.service.durationMin || "--"} min`, x: 48, y: 530, size: 11 },
      { text: `Total del servicio: ${formatBookingPrice(receiptSnapshot?.paymentSummary.total)}`, x: 48, y: 512, size: 11 },
      { text: `Sena abonada: ${formatBookingPrice(receiptSnapshot?.paymentSummary.deposit)}`, x: 48, y: 494, size: 11 },
      { text: "Datos del paciente", x: 48, y: 462, size: 12, bold: true },
      { text: `Nombre: ${clientFullName}`, x: 48, y: 442, size: 11 },
      { text: `Telefono: ${receiptSnapshot?.client.phone || "No disponible"}`, x: 48, y: 424, size: 11 },
      { text: `Email: ${receiptSnapshot?.client.email || "No informado"}`, x: 48, y: 406, size: 11 },
      {
        text: `Observaciones: ${receiptSnapshot?.appointment.notes || "Sin observaciones"}`,
        x: 48,
        y: 388,
        size: 11,
      },
      { text: "Datos del centro", x: 48, y: 356, size: 12, bold: true },
      { text: `Direccion: ${siteConfig.address}`, x: 48, y: 336, size: 11 },
      { text: `Telefono: ${siteConfig.phone}`, x: 48, y: 318, size: 11 },
      { text: `Email: ${siteConfig.contactEmail || "No informado"}`, x: 48, y: 300, size: 11 },
    ];

    const file = buildSimplePdf(pdfLines);
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `comprobante-reserva-${appointmentCode || receiptSnapshot?.appointmentId || "turno"}.pdf`;
    link.click();
    URL.revokeObjectURL(fileUrl);
  }

  return (
    <section className="py-5 md:py-7">
      <div className="container-shell">
        <SectionHeading title="Estado de tu reserva" />
        <div className="mx-auto mt-5 max-w-6xl">
          <div className="card-surface overflow-hidden bg-white/95 p-5 md:p-6">
            <div className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses}`}>
              {icon}
              {copy.title}
            </div>

            <div className="mt-5 space-y-3 text-slate-600">
              <p className="text-sm leading-6 md:text-[15px]">{copy.description}</p>
              <p className="text-sm leading-6">
                Guarda este comprobante para tener a mano el numero de la reserva y el identificador del pago.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
              <div className="rounded-[1.35rem] border border-rose-100 bg-rose-50/35 p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 text-brand-wine">
                  <div className="flex items-center gap-2.5">
                    <ReceiptText className="h-4 w-4" />
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] sm:text-sm">Comprobante de reserva</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-brand-ink transition hover:border-brand-rose hover:text-brand-wine"
                      onClick={() => void handleShareReceipt()}
                      title="Compartir comprobante"
                      aria-label="Compartir comprobante"
                      type="button"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-brand-ink transition hover:border-brand-rose hover:text-brand-wine"
                      onClick={handleDownloadReceipt}
                      title="Descargar comprobante"
                      aria-label="Descargar comprobante"
                      type="button"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2.5">
                  <ResultRow label="Reserva" value={appointmentCode ? `#${appointmentCode}` : "Se generara al confirmar"} />
                  <ResultRow label="Pago" value={paymentId || "Pendiente de referencia"} />
                  <ResultRow label="Operacion" value={merchantOrderId || "Sin numero"} />
                  <ResultRow label="Estado" value={formatMercadoPagoStatus(paymentStatus)} />
                </div>
              </div>

              <aside className="rounded-[1.35rem] border border-rose-100/80 bg-white/90 p-5 shadow-[0_16px_40px_-34px_rgba(90,64,74,0.22)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                  Informacion util
                </p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <p>Si necesitas ayuda con tu turno, escribinos y comparti el comprobante para ubicar la reserva mas rapido.</p>
                  <p>Si el pago quedo en revision, no hace falta reservar de nuevo inmediatamente.</p>
                  <p>
                    Contacto: <span className="font-semibold text-brand-ink">{siteConfig.phone}</span>
                  </p>
                  {siteConfig.contactEmail ? (
                    <p>
                      Email: <span className="font-semibold text-brand-ink">{siteConfig.contactEmail}</span>
                    </p>
                  ) : null}
                  <p>
                    Direccion: <span className="font-semibold text-brand-ink">{siteConfig.address}</span>
                  </p>
                </div>
              </aside>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
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
        </div>
      </div>
    </section>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white bg-white/85 px-3.5 py-2.5 shadow-[0_16px_40px_-34px_rgba(90,64,74,0.22)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
