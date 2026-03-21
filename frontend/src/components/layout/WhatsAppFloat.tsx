import { MessageCircleMore } from "lucide-react";
import { buildWhatsAppUrl } from "../../shared/utils/whatsapp";

export function WhatsAppFloat() {
  return (
    <a
      href={buildWhatsAppUrl("Hola! Quiero consultar por un turno.")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-float transition hover:scale-105"
      aria-label="Abrir WhatsApp"
    >
      <MessageCircleMore size={26} />
    </a>
  );
}
