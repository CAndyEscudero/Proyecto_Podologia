import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MapPinned,
  Search,
  Sparkles,
  Stethoscope,
  TimerReset,
} from "lucide-react";
import toast from "react-hot-toast";
import { createAppointment, getAvailableSlots, getPublicServices } from "../../services/publicApi";
import { Button } from "../../shared/ui/button/Button";
import { BookingCalendar } from "./BookingCalendar";

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

const steps = [
  { id: 1, label: "Servicio", copy: "Elegi el tratamiento que queres reservar." },
  { id: 2, label: "Dia", copy: "Busca la fecha que mejor se adapte a tu agenda." },
  { id: 3, label: "Horario", copy: "Selecciona un horario disponible real." },
  { id: 4, label: "Tus datos", copy: "Completa tus datos para confirmar la solicitud." },
];

export function BookingForm() {
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [nextAvailableOption, setNextAvailableOption] = useState(null);
  const [isSearchingNextDate, setIsSearchingNextDate] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [step, setStep] = useState(1);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
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

  const selectedService = services.find((service) => String(service.id) === serviceId);
  const selectedSlot = slots.find((slot) => slot.startTime === startTime);
  const activeStep = steps.find((item) => item.id === step) || steps[0];

  useEffect(() => {
    async function fetchServices() {
      try {
        setIsLoadingServices(true);
        setServicesError("");
        const data = await getPublicServices();
        setServices(data);
      } catch (error) {
        setServices([]);
        setServicesError("No se pudieron cargar los servicios");
        toast.error(error?.response?.data?.message || "No se pudieron cargar los servicios");
      } finally {
        setIsLoadingServices(false);
      }
    }

    fetchServices();
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!serviceId || !date) {
        setSlots([]);
        setAvailabilityError("");
        return;
      }

      try {
        setIsLoadingSlots(true);
        setAvailabilityError("");
        const data = await getAvailableSlots(serviceId, date);
        setSlots(data.slots || []);

        if (!data.slots?.length) {
          setAvailabilityError("No hay horarios disponibles para esa fecha");
        }
      } catch (error) {
        setSlots([]);
        setAvailabilityError(error?.response?.data?.message || "No se pudo cargar la disponibilidad");
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [serviceId, date]);

  useEffect(() => {
    let cancelled = false;

    async function findNextAvailableDate() {
      if (!serviceId || !date || isLoadingSlots || slots.length > 0) {
        setNextAvailableOption(null);
        setIsSearchingNextDate(false);
        return;
      }

      setIsSearchingNextDate(true);

      try {
        let cursor = dayjs(date).add(1, "day");
        const maxDate = dayjs(maxBookingDate);

        while (cursor.valueOf() <= maxDate.valueOf()) {
          const candidateDate = cursor.format("YYYY-MM-DD");
          const data = await getAvailableSlots(serviceId, candidateDate);

          if (data.slots?.length) {
            if (!cancelled) {
              setNextAvailableOption({
                date: candidateDate,
                firstSlot: data.slots[0].startTime,
                slotsCount: data.slots.length,
              });
            }
            return;
          }

          cursor = cursor.add(1, "day");
        }

        if (!cancelled) {
          setNextAvailableOption(null);
        }
      } catch (_error) {
        if (!cancelled) {
          setNextAvailableOption(null);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingNextDate(false);
        }
      }
    }

    findNextAvailableDate();

    return () => {
      cancelled = true;
    };
  }, [date, isLoadingSlots, maxBookingDate, serviceId, slots.length]);

  const serviceCards = useMemo(
    () =>
      services.map((service) => ({
        ...service,
        priceLabel: formatPrice(service.priceCents),
      })),
    [services]
  );

  async function onSubmit(values) {
    try {
      const response = await createAppointment({
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

      setConfirmation(response);
      toast.success("Turno solicitado correctamente");
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
      setSlots([]);
      setAvailabilityError("");
      setStep(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No fue posible reservar el turno");
    }
  }

  function handleServiceSelect(nextValue) {
    setValue("serviceId", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("date", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setValue("startTime", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setSlots([]);
    setAvailabilityError("");
    setStep(2);
  }

  function handleDateChange(nextDate) {
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
    setNextAvailableOption(null);
    setStep(3);
  }

  function handleSlotChange(nextStartTime) {
    setValue("startTime", nextStartTime, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setStep(4);
  }

  function handleResetFlow() {
    reset();
    setConfirmation(null);
    setSlots([]);
    setAvailabilityError("");
    setStep(1);
  }

  function handleBackToServices() {
    setValue("date", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setValue("startTime", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setSlots([]);
    setAvailabilityError("");
    setNextAvailableOption(null);
    setStep(1);
  }

  function handleBackToDateStep() {
    setValue("startTime", "", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });
    setNextAvailableOption(null);
    setStep(2);
  }

  function handleBackToTimeStep() {
    setStep(3);
  }

  function handleJumpToSuggestedDate() {
    if (!nextAvailableOption) {
      return;
    }

    handleDateChange(nextAvailableOption.date);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_360px] lg:items-start xl:grid-cols-[minmax(0,1fr)_384px] xl:gap-6">
      <div className="card-surface overflow-hidden bg-white/92">
        <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-white to-rose-50/70 px-4 py-5 md:px-6 md:py-6 xl:px-7">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-wine">
              Paso {activeStep.id}
            </p>
            <h2 className="mt-2 font-display text-[2.1rem] leading-none text-brand-ink sm:text-[2.45rem] md:text-[3.1rem]">
              Elegi servicio, fecha y horario
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{activeStep.copy}</p>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((item) => {
              const isActive = item.id === step;
              const isCompleted =
                (item.id === 1 && selectedService) ||
                (item.id === 2 && date) ||
                (item.id === 3 && startTime) ||
                (item.id === 4 && confirmation);

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
                <div className="mb-4 flex items-start justify-between gap-4">
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
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                      Paso 2
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
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
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                      Paso 3
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
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
              <section data-testid="booking-step-client" className="min-w-full p-3.5 md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                      Paso 4
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ya tenes todo elegido. Solo falta completar tus datos para enviar la solicitud.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" className="gap-2" onClick={handleBackToTimeStep}>
                    <ArrowLeft size={16} />
                    Cambiar horario
                  </Button>
                </div>

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
                        rows="4"
                        {...register("notes")}
                        className="field-input min-h-[110px] resize-none py-3"
                        placeholder="Contanos si hay alguna molestia, antecedente o comentario util para la atencion."
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <Button data-testid="booking-submit" type="submit" className="gap-2" disabled={isSubmitting}>
                    {isSubmitting ? "Confirmando..." : "Confirmar solicitud"}
                    {!isSubmitting ? <ArrowRight size={16} /> : null}
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </form>
      </div>

      <aside className="order-first space-y-4 lg:order-none lg:space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="card-surface p-6 md:p-7">
          <div className="flex items-center gap-2 text-brand-wine">
            <CalendarDays size={20} />
            <h3 className="text-2xl font-display">Resumen de tu turno</h3>
          </div>

          {confirmation ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
                <CheckCircle2 size={16} />
                Turno cargado correctamente
              </div>
              <p><strong>Codigo:</strong> #{confirmation.appointment.id}</p>
              <p><strong>Servicio:</strong> {confirmation.appointment.service.name}</p>
              <p><strong>Fecha:</strong> {confirmation.appointment.date}</p>
              <p><strong>Horario:</strong> {confirmation.appointment.startTime}</p>
              <p><strong>Estado:</strong> {confirmation.appointment.status}</p>
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
                        {formatPrice(selectedService.priceCents)}
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
                </div>
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
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="block">
      {label ? <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span> : null}
      {children}
      {error ? <span className="mt-2 block text-xs font-medium text-red-500">{error}</span> : null}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-semibold text-brand-ink">{label}:</span>
      <span className="text-right text-slate-600">{value}</span>
    </div>
  );
}

function formatPrice(priceCents) {
  if (!priceCents) {
    return "Consultar";
  }

  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return formatter.format(priceCents);
}
