import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createAppointment, getAvailableSlots, getPublicServices } from "../../services/publicApi";
import { Button } from "../ui/Button";
import { BookingCalendar } from "./BookingCalendar";

const today = dayjs().format("YYYY-MM-DD");
const maxBookingDate = dayjs().add(45, "day").format("YYYY-MM-DD");
const personNameRegex = /^[A-Za-zÀ-ÿ' -]{2,80}$/;
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

export function BookingForm() {
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
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
    if (date && step === 1) {
      setStep(2);
    }
  }, [date, step]);

  useEffect(() => {
    if (startTime && step <= 2) {
      setStep(3);
    }
  }, [startTime, step]);

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

  function handleServiceChange(nextValue) {
    setValue("serviceId", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue("date", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setValue("startTime", "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setStep(1);
    setSlots([]);
    setAvailabilityError("");
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
    setStep(2);
  }

  function handleSlotChange(nextStartTime) {
    setValue("startTime", nextStartTime, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setStep(3);
  }

  function handleResetFlow() {
    reset();
    setConfirmation(null);
    setSlots([]);
    setAvailabilityError("");
    setStep(1);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.24fr_0.76fr] lg:items-start">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card-surface p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-wine">Paso 1</p>
              <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink md:text-[3.6rem]">
                Elegi servicio, fecha y horario
              </h2>
            </div>
            <div className="rounded-full bg-rose-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-wine">
              Reserva guiada
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Servicio" error={errors.serviceId?.message || servicesError}>
              <select
                data-testid="booking-service-select"
                value={serviceId}
                onChange={(event) => handleServiceChange(event.target.value)}
                className="field-input"
                disabled={isLoadingServices}
              >
                <option value="">
                  {isLoadingServices ? "Cargando servicios..." : "Selecciona una opcion"}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <input type="hidden" {...register("serviceId")} />
            </Field>

            {selectedService ? (
              <div className="rounded-[1.4rem] border border-rose-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                      {selectedService.name}
                    </p>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                      {selectedService.description}
                    </p>
                  </div>
                  <div className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-brand-wine">
                    {selectedService.durationMin} min
                  </div>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-[1.7rem] border border-rose-100/80 bg-gradient-to-b from-white to-rose-50/40">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
              >
                <section data-testid="booking-step-date" className="min-w-full p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                        Fecha de atencion
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Elegi el dia y avanzamos al horario disponible.
                      </p>
                    </div>
                    {date ? (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-brand-wine">
                        {dayjs(date).format("DD/MM")}
                      </span>
                    ) : null}
                  </div>

                  <Field label="" error={errors.date?.message}>
                    <BookingCalendar
                      value={date}
                      minDate={today}
                      maxDate={maxBookingDate}
                      onChange={handleDateChange}
                    />
                    <input type="hidden" {...register("date")} />
                  </Field>
                </section>

                <section data-testid="booking-step-time" className="min-w-full p-4 md:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">
                        Horario disponible
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {date ? `Horarios para ${dayjs(date).format("DD/MM/YYYY")}` : "Elegi una fecha para ver horarios"}
                      </p>
                    </div>
                    <Button type="button" variant="secondary" className="gap-2" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} />
                      Cambiar dia
                    </Button>
                  </div>

                  <Field label="" error={errors.startTime?.message || availabilityError}>
                    <div className="rounded-[1.4rem] border border-rose-200/80 bg-white p-3.5 md:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                          <Clock3 size={16} className="text-brand-wine" />
                          Horarios reales disponibles
                        </div>
                        {isLoadingSlots ? (
                          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                            <LoaderCircle size={16} className="animate-spin" />
                            Cargando disponibilidad
                          </span>
                        ) : null}
                      </div>

                      {date && !isLoadingSlots && slots.length > 0 ? (
                        <div data-testid="booking-slots-grid" className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
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
                                  "rounded-xl border px-3 py-2.5 text-left transition",
                                  isSelected
                                    ? "border-brand-rose bg-brand-rose text-white shadow-lg shadow-rose-200/70"
                                    : "border-rose-100 bg-rose-50/50 text-brand-ink hover:border-brand-rose hover:bg-white",
                                ].join(" ")}
                              >
                                <span className="block text-sm font-extrabold">{slot.startTime}</span>
                                <span
                                  className={
                                    isSelected
                                      ? "mt-1 block text-[11px] text-rose-50"
                                      : "mt-1 block text-[11px] text-slate-500"
                                  }
                                >
                                  hasta {slot.endTime}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <input type="hidden" {...register("startTime")} />
                  </Field>
                </section>

                <section data-testid="booking-step-client" className="min-w-full p-4 md:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">Tus datos</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Completa tus datos para confirmar el turno.
                      </p>
                    </div>
                    <Button type="button" variant="secondary" className="gap-2" onClick={() => setStep(2)}>
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
              </div>
            </div>
          </div>
        </div>
      </form>

      <aside className="space-y-5">
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
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><strong>Servicio:</strong> {selectedService?.name || "Pendiente"}</p>
              <p><strong>Fecha:</strong> {date ? dayjs(date).format("DD/MM/YYYY") : "Pendiente"}</p>
              <p><strong>Horario:</strong> {selectedSlot?.startTime || "Pendiente"}</p>
              {selectedSlot ? <p><strong>Finaliza:</strong> {selectedSlot.endTime}</p> : null}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span> : null}
      {children}
      {error ? <span className="mt-2 block text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  );
}
