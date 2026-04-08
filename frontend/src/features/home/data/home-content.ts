import {
  Activity,
  BadgeCheck,
  CalendarClock,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  AdminHighlight,
  HomeBenefit,
  HomeFaq,
  HomeServiceCard,
  HomeTestimonial,
  TrustPillar,
} from "../types/home.types";

export const services: HomeServiceCard[] = [
  {
    id: 1,
    name: "Servicio destacado",
    duration: 45,
    priceLabel: "45 min",
    description: "Ejemplo de servicio destacado para una experiencia clara y profesional.",
    image: "/images/servicio-podologia-clinica.webp",
  },
  {
    id: 2,
    name: "Sesion de cuidado",
    duration: 60,
    priceLabel: "60 min",
    description: "Una opcion pensada para mostrar variedad sin atar la home a un rubro especifico.",
    image: "/images/servicio-pedicuria-estetica.webp",
  },
  {
    id: 3,
    name: "Turno express",
    duration: 30,
    priceLabel: "30 min",
    description: "Ideal para negocios que ofrecen atenciones breves con reserva online.",
    image: "/images/servicio-esmaltado-semipermanente.webp",
  },
  {
    id: 4,
    name: "Experiencia premium",
    duration: 50,
    priceLabel: "50 min",
    description: "Una referencia visual para una propuesta de mayor duracion o valor agregado.",
    image: "/images/servicio-spa-de-pies.webp",
  },
];

export const benefits: HomeBenefit[] = [
  {
    title: "Experiencia profesional",
    copy: "Cada reserva busca combinar claridad, buen trato y una atencion alineada con el servicio elegido.",
    icon: Activity,
  },
  {
    title: "Operacion confiable",
    copy: "Horarios reales, informacion ordenada y menos errores en la gestion diaria del negocio.",
    icon: ShieldCheck,
  },
  {
    title: "Acompanamiento cercano",
    copy: "Una experiencia amable y simple para que consultar, reservar y asistir sea facil.",
    icon: HeartHandshake,
  },
  {
    title: "Gestion ordenada de turnos",
    copy: "Disponibilidad real, confirmacion visual y una agenda pensada para evitar fricciones.",
    icon: CalendarClock,
  },
];

export const testimonials: HomeTestimonial[] = [
  {
    author: "Mariana G.",
    quote: "Reservar fue rapido y claro. Me dio confianza ver todo ordenado antes de confirmar.",
  },
  {
    author: "Lucia R.",
    quote: "Me gusto poder elegir servicio y horario sin vueltas. La experiencia se siente profesional.",
  },
  {
    author: "Carla M.",
    quote: "El sistema transmite prolijidad y hace mucho mas simple coordinar una reserva.",
  },
];

export const faqs: HomeFaq[] = [
  {
    question: "Necesito turno previo?",
    answer: "Si. La agenda funciona con turnos para mostrar disponibilidad real y evitar superposiciones.",
  },
  {
    question: "Puedo consultar antes de reservar?",
    answer: "Si. El sitio esta pensado para reservar, pero tambien deja abierta la via de WhatsApp para consultas.",
  },
  {
    question: "Que pasa si un servicio no tiene precio publicado?",
    answer: "El negocio puede resolverlo por contacto directo y coordinar la reserva manualmente si hace falta.",
  },
  {
    question: "Que pasa si necesito reprogramar?",
    answer: "Desde administracion el turno puede reprogramarse sin perder trazabilidad de la reserva.",
  },
];

export const adminHighlights: AdminHighlight[] = [
  { label: "Turnos de hoy", value: "12" },
  { label: "Pendientes", value: "04" },
  { label: "Confirmados", value: "06" },
  { label: "Clientes nuevos", value: "03" },
];

export const trustPillars: TrustPillar[] = [
  { title: "Profesionalismo", icon: BadgeCheck },
  { title: "Buen servicio", icon: Sparkles },
  { title: "Reserva simple", icon: CalendarClock },
];
