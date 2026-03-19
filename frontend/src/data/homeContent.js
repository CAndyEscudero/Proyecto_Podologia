import {
  Activity,
  BadgeCheck,
  CalendarClock,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const services = [
  {
    id: 1,
    name: "Podologia clinica",
    duration: 45,
    priceLabel: "45 min",
    description:
      "Atencion profesional para molestias, callosidades, durezas y cuidado preventivo con enfoque clinico.",
    image: "/images/servicio-podologia-clinica.webp",
  },
  {
    id: 2,
    name: "Pedicuria estetica",
    duration: 60,
    priceLabel: "60 min",
    description:
      "Tratamiento estetico prolijo y delicado para mantener tus pies cuidados y con una imagen impecable.",
    image: "/images/servicio-pedicuria-estetica.webp",
  },
  {
    id: 3,
    name: "Esmaltado semipermanente",
    duration: 30,
    priceLabel: "30 min",
    description:
      "Aplicacion con terminacion elegante, brillo duradero y enfoque en detalles.",
    image: "/images/servicio-esmaltado-semipermanente.webp",
  },
  {
    id: 4,
    name: "Spa de pies",
    duration: 50,
    priceLabel: "50 min",
    description:
      "Exfoliacion, hidratacion y relax para completar una experiencia de bienestar real.",
    image: "/images/servicio-spa-de-pies.webp",
  },
];

export const benefits = [
  {
    title: "Experiencia profesional",
    copy: "Cada atencion parte de criterio tecnico, escucha y personalizacion del tratamiento.",
    icon: Activity,
  },
  {
    title: "Higiene y seguridad",
    copy: "Protocolos claros, instrumental preparado y un entorno confiable en cada visita.",
    icon: ShieldCheck,
  },
  {
    title: "Acompañamiento cercano",
    copy: "Una experiencia amable y simple para que reservar y atenderte sea facil.",
    icon: HeartHandshake,
  },
  {
    title: "Gestion ordenada de turnos",
    copy: "Disponibilidad real, confirmacion visual y una agenda pensada para evitar fricciones.",
    icon: CalendarClock,
  },
];

export const testimonials = [
  {
    author: "Mariana G.",
    quote: "Me senti super comoda desde el primer momento. La atencion fue profesional y muy cuidada.",
  },
  {
    author: "Lucia R.",
    quote: "Buscaba un lugar serio y prolijo. La experiencia fue clara, ordenada y muy agradable.",
  },
  {
    author: "Carla M.",
    quote: "Se nota el cuidado en cada detalle: desde el trato hasta el resultado final.",
  },
];

export const faqs = [
  {
    question: "Necesito turno previo?",
    answer: "Si. La agenda funciona con turnos para brindar puntualidad y una atencion realmente personalizada.",
  },
  {
    question: "Puedo consultar antes de reservar?",
    answer: "Si. El sitio esta pensado para reservar, pero tambien deja abierta la via de WhatsApp para consultas.",
  },
  {
    question: "Atienden casos clinicos y esteticos?",
    answer: "Si. La propuesta combina salud, prevencion, alivio de molestias y cuidado estetico.",
  },
  {
    question: "Que pasa si necesito reprogramar?",
    answer: "Desde administracion el turno puede reprogramarse sin perder trazabilidad del cliente.",
  },
];

export const adminHighlights = [
  { label: "Turnos de hoy", value: "12" },
  { label: "Pendientes", value: "04" },
  { label: "Confirmados", value: "06" },
  { label: "Clientes nuevos", value: "03" },
];

export const trustPillars = [
  { title: "Profesionalismo", icon: BadgeCheck },
  { title: "Bienestar", icon: Sparkles },
  { title: "Reserva simple", icon: CalendarClock },
];
