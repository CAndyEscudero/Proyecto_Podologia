import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPinned,
  Search,
  Sparkles,
  Stethoscope,
  TimerReset,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../../shared/ui/button/Button";
import type {
  ApiErrorResponse,
  CreateAppointmentPaymentResponse,
} from "../../../shared/types/api";
import type { Service } from "../../../shared/types/domain";
import { createPaymentReservation } from "../api/booking.api";
import { BookingCalendar } from "./BookingCalendar";
import { useBookingAvailability } from "../hooks/useBookingAvailability";
import {
  calculateDepositCents,
  calculateRemainingCents,
  formatBookingPrice,
} from "../utils/booking-formatters";
import { buildWhatsAppUrl } from "../../../shared/utils/whatsapp";
import type {
  BookingFieldProps,
  BookingFormValues,
  BookingStep,
  BookingSummaryRowProps,
} from "../types/booking.types";

const today = dayjs().format("YYYY-MM-DD");
const maxBookingDate = dayjs().add(45, "day").format("YYYY-MM-DD");
const personNameRegex = /^[\p{L}' -]{2,80}$/u;
const phoneRegex = /^[0-9+() -]{8,20}$/;

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  date: z
    .string()
    .min(1, "Selecciona una fecha")
    .refine((value) => dayjs(value).isSame(dayjs(), "day") || dayjs(value).isAfter(dayjs(), "day"), {
      message: "No podes reservar turnos en fechas pasadas",
    }),
  startTime: z.string().min(1, "Selecciona un horario"),
  firstName: z.string().trim().regex(personNameRegex, "Ingresa un nombre valido"),
  lastName: z.string().trim().regex(personNameRegex, "Ingresa un apellido valido"),
  phone: z.string().trim().regex(phoneRegex, "Ingresa un telefono valido"),
  email: z.string().trim().max(120, "Email demasiado largo").email("Ingresa un email valido"),
  notes: z.string().trim().max(1000, "Las observaciones son demasiado largas").optional(),
});

const steps: BookingStep[] = [
  { id: 1, label: "Servicio", copy: "Elegi el tratamiento que queres reservar." },
  { id: 2, label: "Dia", copy: "Busca la fecha que mejor se adapte a tu agenda." },
  { id: 3, label: "Horario", copy: "Selecciona un horario disponible real." },
  { id: 4, label: "Tus datos", copy: "Completa tus datos para confirmar la solicitud." },
];

const BOOKING_RECEIPT_STORAGE_KEY = "booking_receipt_snapshot";

function getApiMessage(error: unknown, fallbackMessage: string): string {
  const maybeError = error as { response?: { data?: ApiErrorResponse } };
  return maybeError?.response?.data?.message || fallbackMessage;
}

export function BookingForm() {
  const [pendingReservation, setPendingReservation] = useState<CreateAppointmentPaymentResponse | null>(null);
  const [step, setStep] = useState<BookingStep["id"]>(1);
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: "",
      date: "",
      startTime: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const serviceId = watch("serviceId");
  const date = watch("date");
  const startTime = watch("startTime");

  const {
    services,
    servicesError,
    isLoadingServices,
    slots,
    isLoadingSlots,
    availabilityError,
    nextAvailableOption,
    isSearchingNextDate,
    clearSuggestions,
  } = useBookingAvailability({
    serviceId,
    date,
    maxBookingDate,
  });

  const selectedService = services.find((service: Service) => String(service.id) === serviceId);
  const selectedSlot = slots.find((slot) => slot.startTime === startTime);
  const activeStep = steps.find((item) => item.id === step) || steps[0];
  const depositCents = calculateDepositCents(selectedService?.priceCents);
  const remainingCents = calculateRemainingCents(selectedService?.priceCents, depositCents);
  const serviceNeedsManualQuote = Boolean(selectedService && !selectedService.priceCents);

  const serviceCards = useMemo(
    () =>
      services.map((service) => ({
        ...service,
        priceLabel: formatBookingPrice(service.priceCents),
      })),
    [services]
  );

  useEffect(() => {
    const requestedService = searchParams.get("service");

    if (!requestedService || serviceId || services.length === 0) {
      return;
    }

    const normalizedRequestedService = normalizeServiceName(requestedService);
    const matchedService = services.find(
      (service) => normalizeServiceName(service.name) === normalizedRequestedService
    );

    if (matchedService) {
      handleServiceSelect(String(matchedService.id));
    }
  }, [searchParams, services, serviceId]);

  const onSubmit: SubmitHandler<BookingFormValues> = async (values) => {
    try {
      const response = await createPaymentReservation({
        serviceId: Number(values.serviceId),
        date: values.date,
        startTime: values.startTime,
        client: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          email: values.email,
          notes: values.notes,
        },
      });

      setPendingReservation(response);
      window.sessionStorage.setItem(
        BOOKING_RECEIPT_STORAGE_KEY,
        JSON.stringify({
          appointmentId: response.appointment.id,
          issuedAt: response.appointment.createdAt || new Date().toISOString(),
          appointment: {
            date: response.appointment.date,
            startTime: response.appointment.startTime,
            endTime: response.appointment.endTime,
            notes: response.appointment.notes,
          },
          client: {
            firstName: response.appointment.client.firstName,
            lastName: response.appointment.client.lastName,
            phone: response.appointment.client.phone,
            email: response.appointment.client.email,
          },
          service: {
            name: response.appointment.service.name,
            durationMin: response.appointment.service.durationMin,
          },
          paymentSummary: {
            total: response.paymentSummary.priceCents,
            deposit: response.paymentSummary.depositCents,
            paymentOption: response.paymentSummary.paymentOption,
          },
        })
      );
      toast.success("Reserva pendiente creada. Te redirigimos a Mercado Pago.");
      reset({
        serviceId: "",
        date: "",
        startTime: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        notes: "",
      });
      clearSuggestions();
      setStep(1);

      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl);
        return;
      }

      toast("La reserva quedo creada, pero no encontramos la URL de pago.", {
        icon: "⚠️",
      });
    } catch (error) {
      toast.error(getApiMessage(error, "No fue posible iniciar la reserva con pago"));
    }
  };

  function handleServiceSelect(nextValue: string): void {
    setValue("serviceId", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("date", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setValue("startTime", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setStep(2);
  }

  function handleDateChange(nextDate: string): void {
    setValue("date", nextDate, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("startTime", "", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    clearSuggestions();
    setStep(3);
  }

  function handleSlotChange(nextStartTime: string): void {
    setValue("startTime", nextStartTime, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setStep(4);
    setIsClientSheetOpen(true);
  }

  function handleResetFlow(): void {
    reset();
    setPendingReservation(null);
    clearSuggestions();
    setStep(1);
    setIsClientSheetOpen(false);
  }

  function handleBackToServices(): void {
    setValue("date", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setValue("startTime", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    clearSuggestions();
    setStep(1);
  }

  function handleBackToDateStep(): void {
    setValue("startTime", "", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });
    clearSuggestions();
    setStep(2);
  }

  function handleBackToTimeStep(): void {
    setStep(3);
    setIsClientSheetOpen(false);
  }

  function handleJumpToSuggestedDate(): void {
    if (!nextAvailableOption) {
      return;
    }

    handleDateChange(nextAvailableOption.date);
  }

  const manualQuoteWhatsAppUrl = selectedService
    ? buildWhatsAppUrl(
        `Hola, quiero consultar el precio y reservar el servicio "${selectedService.name}".`
      )
    : buildWhatsAppUrl("Hola, quiero consultar un servicio y reservar un turno.");

  const currentStepStatus = `${activeStep.id} de ${steps.length}`;
  const mobileSummaryText = selectedService
    ? [selectedService.name, date ? dayjs(date).format("DD/MM") : null, selectedSlot?.startTime || null]
        .filter(Boolean)
        .join(" · ")
    : "Elegi un servicio para empezar";

  const clientStepContent = (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" error={errors.firstName?.message}>
          <input data-testid="booking-first-name" type="text" {...register("firstName")} className="field-input" />
        </Field>

        <Field label="Apellido" error={errors.lastName?.message}>
          <input data-testid="booking-last-name" type="text" {...register("lastName")} className="field-input" />
        </Field>

        <Field label="Telefono" error={errors.phone?.message}>
          <input data-testid="booking-phone" type="tel" {...register("phone")} className="field-input" />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input data-testid="booking-email" type="email" {...register("email")} className="field-input" />
        </Field>

        <div className="md:col-span-2">
          <Field label="Observaciones">
            <textarea
              data-testid="booking-notes"
              rows={4}
              {...register("notes")}
              className="field-input min-h-[110px] resize-none py-3"
              placeholder="Contanos si hay alguna molestia, antecedente o comentario util para la atencion."
            />
          </Field>
        </div>
      </div>

      {serviceNeedsManualQuote ? (
        <div className="mt-6 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <p className="font-semibold">Este servicio todavia no tiene precio online configurado.</p>
          <p className="mt-2 leading-6">
            Para reservarlo, escribinos por WhatsApp y te ayudamos manualmente con el valor y la coordinacion.
          </p>
          <div className="mt-4">
            <a href={manualQuoteWhatsAppUrl} target="_blank" rel="noreferrer">
              <Button type="button" variant="secondary" className="gap-2">
                Consultar por WhatsApp
                <ExternalLink size={16} />
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-4">
          <Button
            data-testid="booking-submit"
            type="button"
            className="gap-2"
            disabled={isSubmitting}
            onClick={() => void handleSubmit(onSubmit)()}
          >
            {isSubmitting ? "Redirigiendo..." : "Reservar turno con sena"}
            {!isSubmitting ? <ArrowRight size={16} /> : null}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_360px] lg:items-start xl:grid-cols-[minmax(0,1fr)_384px] xl:gap-6">
      <div className="card-surface overflow-hidden bg-white/92">
        <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-white to-rose-50/70 px-4 py-5 md:px-6 md:py-6 xl:px-7">
          <div className="min-w-0">
            <p className="hidden text-xs font-extrabold uppercase tracking-[0.22em] text-brand-wine md:block">
              Paso {activeStep.id}
            </p>
            <h2 className="mt-1 font-display text-[2rem] leading-none text-brand-ink sm:text-[2.45rem] md:mt-2 md:text-[3.1rem]">
              Elegi servicio, fecha y horario
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{activeStep.copy}</p>
          </div>

          <div className="mt-4 rounded-[1.1rem] border border-rose-100 bg-white/80 p-3 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                  Reserva guiada
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">Paso {currentStepStatus}</p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-brand-wine">
                {activeStep.label}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{mobileSummaryText}</p>
          </div>

          <div className="mt-5 hidden gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((item) => {
              const isActive = item.id === step;
              const isCompleted =
                (item.id === 1 && selectedService) ||
                (item.id === 2 && date) ||
                (item.id === 3 && startTime) ||
                (item.id === 4 && pendingReservation);

              return (
                <div
                  key={item.id}
                  className={[
                    "rounded-[1.2rem] border px-3.5 py-3 transition md:px-4",
                    isActive
                      ? "border-brand-rose bg-rose-50 shadow-soft"
                      : isCompleted
                        ? "border-emerald-100 bg-emerald-50/70"
                        : "border-rose-100 bg-white/70",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        Paso {item.id}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-ink">{item.label}</p>
                    </div>
                    <span
                      className={[
                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        isActive
                          ? "bg-brand-rose text-white"
                          : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-100 text-brand-wine",
                      ].join(" ")}
                    >
                      {isCompleted ? <CheckCircle2 size={15} /> : item.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-3.5 md:p-5 xl:p-6">
          <input type="hidden" {...register("serviceId")} />
          <input type="hidden" {...register("date")} />
          <input type="hidden" {...register("startTime")} />

          <div className="rounded-[1.6rem] border border-rose-100/80 bg-gradient-to-b from-white to-rose-50/35 md:rounded-[1.85rem]">
            {step === 1 ? (
              <section data-testid="booking-step-service" className="min-w-full p-3.5 md:p-5">
                <div className="mb-4 hidden items-start justify-between gap-4 md:flex">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                      Paso 1
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      En vez de un selector simple, te mostramos cada servicio como una opcion clara y accionable.
                    </p>
                  </div>
                </div>

                <Field label="" error={errors.serviceId?.message || servicesError}>
                  {isLoadingServices ? (
                    <div className="rounded-[1.5rem] border border-rose-100 bg-white px-4 py-10 text-sm text-slate-500">
                      Cargando servicios...
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {serviceCards.map((service) => {
                        const isSelected = String(service.id) === serviceId;

                        return (
                          <button
                            key={service.id}
                            type="button"
                            data-testid={`booking-service-card-${service.id}`}
                            onClick={() => handleServiceSelect(String(service.id))}
                            className={[
                              "rounded-[1.45rem] border px-4 py-4 text-left transition md:px-5 md:py-5",
                              isSelected
                                ? "border-brand-rose bg-gradient-to-br from-[#9e6b78] to-[#ca94a2] text-white shadow-xl shadow-rose-300/35"
                                : "border-rose-100 bg-white hover:-translate-y-0.5 hover:border-brand-rose hover:shadow-soft",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p
                                  className={[
                                    "text-lg font-bold",
                                    isSelected ? "text-white" : "text-brand-ink",
                                  ].join(" ")}
                                >
                                  {service.name}
                                </p>
                                <p
                                  className={[
                                    "mt-2 text-sm leading-6",
                                    isSelected ? "text-rose-50/90" : "text-slate-600",
                                  ].join(" ")}
                                >
                                  {service.description}
                                </p>
                              </div>

                              <div
                                className={[
                                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                                  isSelected
                                    ? "border-white/35 bg-white/10 text-white"
                                    : "border-rose-200 bg-rose-50 text-brand-wine",
                                ].join(" ")}
                              >
                                <Stethoscope size={18} />
                              </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={[
                                    "rounded-full px-3 py-1 text-xs font-bold",
                                    isSelected ? "bg-white/15 text-white" : "bg-rose-100 text-brand-wine",
                                  ].join(" ")}
                                >
                                  {service.durationMin} min
                                </span>
                                <span
                                  className={[
                                    "rounded-full px-3 py-1 text-xs font-bold",
                                    isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
                                  ].join(" ")}
                                >
                                  {service.priceLabel}
                                </span>
                              </div>

                              <span
                                className={[
                                  "inline-flex items-center gap-2 text-sm font-bold",
                                  isSelected ? "text-white" : "text-brand-wine",
                                ].join(" ")}
                              >
                                Elegir servicio
                                <ChevronRight size={16} />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Field>
              </section>
            ) : null}

            {step === 2 ? (
              <section data-testid="booking-step-date" className="min-w-full p-3.5 md:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 md:items-center">
                  <div className="max-w-2xl">
                    <p className="hidden text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine md:block">
                      Paso 2
                    </p>
                    <p className="text-sm text-slate-500 md:mt-1">
                      Busca un dia disponible. Si queres cambiar el servicio, podes volver atras sin perder el control del flujo.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" className="gap-2" onClick={handleBackToServices}>
                    <ArrowLeft size={16} />
                    Cambiar servicio
                  </Button>
                </div>

                <Field label="" error={errors.date?.message}>
                  <BookingCalendar
                    value={date}
                    minDate={today}
                    maxDate={maxBookingDate}
                    onChange={handleDateChange}
                  />
                </Field>
              </section>
            ) : null}

            {step === 3 ? (
              <section data-testid="booking-step-time" className="min-w-full p-3.5 md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="hidden text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine md:block">
                      Paso 3
                    </p>
                    <p className="text-sm text-slate-500 md:mt-1">
                      Horarios reales disponibles para {date ? dayjs(date).format("DD/MM/YYYY") : "la fecha elegida"}.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" className="gap-2" onClick={handleBackToDateStep}>
                    <ArrowLeft size={16} />
                    Cambiar dia
                  </Button>
                </div>

                <Field label="" error={errors.startTime?.message || availabilityError}>
                  <div className="rounded-[1.35rem] border border-rose-200/80 bg-white p-3.5 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                        <Clock3 size={16} className="text-brand-wine" />
                        Horarios disponibles
                      </div>
                      {isLoadingSlots ? (
                        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                          <LoaderCircle size={16} className="animate-spin" />
                          Cargando disponibilidad
                        </span>
                      ) : null}
                    </div>

                    {date && !isLoadingSlots && slots.length > 0 ? (
                      <div
                        data-testid="booking-slots-grid"
                        className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
                      >
                        {slots.map((slot) => {
                          const isSelected = startTime === slot.startTime;

                          return (
                            <button
                              key={slot.startTime}
                              type="button"
                              onClick={() => handleSlotChange(slot.startTime)}
                              data-testid={`booking-slot-${slot.startTime}`}
                              aria-label={`Seleccionar horario ${slot.startTime}`}
                              className={[
                                "rounded-[1.15rem] border px-4 py-3 text-left transition",
                                isSelected
                                  ? "border-brand-rose bg-brand-rose text-white shadow-lg shadow-rose-200/70"
                                  : "border-rose-100 bg-rose-50/55 text-brand-ink hover:border-brand-rose hover:bg-white",
                              ].join(" ")}
                            >
                              <span className="block text-sm font-extrabold">{slot.startTime}</span>
                              <span
                                className={[
                                  "mt-1 block text-[11px]",
                                  isSelected ? "text-rose-50" : "text-slate-500",
                                ].join(" ")}
                              >
                                hasta {slot.endTime}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : date && !isLoadingSlots ? (
                      <div className="mt-4 space-y-3 rounded-[1.2rem] border border-dashed border-rose-200 bg-rose-50/45 px-4 py-5 text-sm text-slate-500">
                        <div className="flex items-start gap-3">
                          <Search size={16} className="mt-0.5 shrink-0 text-brand-wine" />
                          <div>
                            <p className="font-semibold text-brand-ink">No hay horarios disponibles para este dia.</p>
                            <p className="mt-1 leading-6">
                              Proba otra fecha o usa la sugerencia automatica si queres saltar al proximo hueco disponible.
                            </p>
                          </div>
                        </div>

                        {isSearchingNextDate ? (
                          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                            <LoaderCircle size={14} className="animate-spin" />
                            Buscando proxima fecha disponible
                          </div>
                        ) : nextAvailableOption ? (
                          <div className="rounded-[1rem] border border-rose-200 bg-white px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                                  Sugerencia automatica
                                </p>
                                <p className="text-sm font-semibold text-brand-ink">
                                  {dayjs(nextAvailableOption.date).format("dddd DD/MM/YYYY")}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Primer horario: {nextAvailableOption.firstSlot} - {nextAvailableOption.slotsCount} opciones
                                </p>
                              </div>
                              <Button type="button" className="min-h-10 px-4 text-xs" onClick={handleJumpToSuggestedDate}>
                                Ir a esa fecha
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                            <TimerReset size={14} className="text-brand-wine" />
                            No encontramos otra fecha con turnos dentro de la ventana actual.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </Field>
              </section>
            ) : null}

            {step === 4 ? (
              <section data-testid="booking-step-client" className="hidden min-w-full p-3.5 md:block md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="hidden text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine md:block">
                      Paso 4
                    </p>
                    <p className="text-sm text-slate-500 md:mt-1">
                      Ya tenes todo elegido. Completa tus datos y te redirigimos a Mercado Pago para abonar la sena del 50%.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" className="gap-2" onClick={handleBackToTimeStep}>
                    <ArrowLeft size={16} />
                    Cambiar horario
                  </Button>
                </div>

                {clientStepContent}
              </section>
            ) : null}
          </div>
        </form>
      </div>

      <aside className="hidden space-y-4 lg:order-none lg:block lg:space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="card-surface p-6 md:p-7">
          <div className="flex items-center gap-2 text-brand-wine">
            <CalendarDays size={20} />
            <h3 className="text-2xl font-display">Resumen de tu turno</h3>
          </div>

          {pendingReservation ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-amber-700">
                <Clock3 size={16} />
                Reserva pendiente de pago
              </div>
              <p><strong>Codigo:</strong> #{pendingReservation.appointment.id}</p>
              <p><strong>Servicio:</strong> {pendingReservation.appointment.service.name}</p>
              <p><strong>Fecha:</strong> {pendingReservation.appointment.date}</p>
              <p><strong>Horario:</strong> {pendingReservation.appointment.startTime}</p>
              <p><strong>Estado de pago:</strong> {pendingReservation.paymentSummary.paymentStatus}</p>
              <p><strong>Total:</strong> {formatBookingPrice(pendingReservation.paymentSummary.priceCents)}</p>
              <p><strong>Sena 50%:</strong> {formatBookingPrice(pendingReservation.paymentSummary.depositCents)}</p>
              <div className="pt-4">
                <Button type="button" variant="secondary" onClick={handleResetFlow}>
                  Reservar otro turno
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="rounded-[1.55rem] border border-rose-100 bg-gradient-to-br from-[#9e6b78] to-[#ca94a2] p-5 text-white shadow-xl shadow-rose-300/30">
                <div className="flex items-center gap-2 text-rose-50">
                  <Sparkles size={16} />
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em]">Servicio</p>
                </div>

                {selectedService ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{selectedService.name}</p>
                        <p className="mt-2 text-sm leading-6 text-rose-50/90">{selectedService.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">
                        {selectedService.durationMin} min
                      </span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">
                        {formatBookingPrice(selectedService.priceCents)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-rose-50/90">
                    Elegi un servicio para abrir el flujo y ver el resumen completo de la reserva.
                  </p>
                )}
              </div>

              <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50/40 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">Tu seleccion</p>
                <div className="mt-3 space-y-3">
                  <SummaryRow label="Servicio" value={selectedService?.name || "Pendiente"} />
                  <SummaryRow label="Fecha" value={date ? dayjs(date).format("DD/MM/YYYY") : "Pendiente"} />
                  <SummaryRow label="Horario" value={selectedSlot?.startTime || "Pendiente"} />
                  <SummaryRow label="Finaliza" value={selectedSlot?.endTime || "Pendiente"} />
                  <SummaryRow
                    label="Total"
                    value={selectedService ? formatBookingPrice(selectedService.priceCents) : "Pendiente"}
                  />
                  <SummaryRow label="Seña 50%" value={formatBookingPrice(depositCents)} />
                  <SummaryRow label="Saldo restante" value={formatBookingPrice(remainingCents)} />
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                  Confirmacion de reserva
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Para confirmar el turno te vamos a pedir una sena del 50%. El saldo restante lo abonas al momento
                  de la atencion.
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-dashed border-rose-200 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500">
                <div className="flex items-start gap-2">
                  <MapPinned size={14} className="mt-0.5 shrink-0 text-brand-wine" />
                  <p>
                    El resumen actua como panel inteligente del turno: te muestra lo elegido, lo pendiente y te ayuda a detectar rapido si necesitas volver un paso atras.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {!pendingReservation ? (
        <div className="lg:hidden">
          <div className="rounded-[1.4rem] border border-rose-100 bg-white/92 p-4 shadow-[0_18px_45px_-38px_rgba(90,64,74,0.26)]">
            <div className="flex items-center gap-2 text-brand-wine">
              <CalendarDays size={18} />
              <h3 className="text-lg font-display text-brand-ink">Tu reserva</h3>
            </div>

            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <SummaryRow label="Servicio" value={selectedService?.name || "Pendiente"} />
              <SummaryRow label="Fecha" value={date ? dayjs(date).format("DD/MM/YYYY") : "Pendiente"} />
              <SummaryRow label="Horario" value={selectedSlot?.startTime || "Pendiente"} />
              <SummaryRow label="Seña 50%" value={formatBookingPrice(depositCents)} />
            </div>

            <div className="mt-4 rounded-[1rem] border border-emerald-100 bg-emerald-50/70 px-3.5 py-3 text-sm leading-6 text-emerald-900">
              Para confirmar el turno te vamos a pedir una sena del 50%. El saldo restante lo abonas al momento de la atencion.
            </div>

            {step === 4 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button type="button" className="w-full" onClick={() => setIsClientSheetOpen(true)}>
                  Completar datos
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={handleBackToTimeStep}>
                  Cambiar horario
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 4 && !pendingReservation ? (
        <div
          className={[
            "fixed inset-0 z-40 bg-brand-ink/40 p-3 transition md:hidden",
            isClientSheetOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div className="flex min-h-full items-end justify-center">
            <div className="max-h-[88vh] w-full overflow-y-auto rounded-[1.8rem] bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">Ultimo paso</p>
                  <h3 className="mt-1 font-display text-[2rem] leading-none text-brand-ink">Tus datos</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Completa tus datos y te redirigimos a Mercado Pago para abonar la sena del 50%.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClientSheetOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-brand-ink"
                  aria-label="Cerrar formulario de datos"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 rounded-[1rem] border border-rose-100 bg-rose-50/45 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-brand-ink">{selectedService?.name || "Servicio seleccionado"}</p>
                <p className="mt-1">
                  {date ? dayjs(date).format("DD/MM/YYYY") : "Fecha pendiente"} · {selectedSlot?.startTime || "Horario pendiente"}
                </p>
              </div>

              <div className="mt-3">
                <Button type="button" variant="secondary" className="w-full" onClick={handleBackToTimeStep}>
                  Cambiar horario
                </Button>
              </div>

              <div className="mt-5">
                {clientStepContent}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, error, children }: BookingFieldProps) {
  return (
    <div className="block">
      {label ? <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span> : null}
      {children}
      {error ? <span className="mt-2 block text-xs font-medium text-red-500">{error}</span> : null}
    </div>
  );
}

function SummaryRow({ label, value }: BookingSummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-semibold text-brand-ink">{label}:</span>
      <span className="text-right text-slate-600">{value}</span>
    </div>
  );
}

function normalizeServiceName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
