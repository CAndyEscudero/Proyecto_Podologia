import { useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm, type SubmitHandler, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  CalendarCheck2,
  CalendarClock,
  Clock3,
  CreditCard,
  FilePenLine,
  PhoneCall,
  Stethoscope,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getAvailableSlots } from "../../availability/api/availability.api";
import { Button } from "../../../../shared/ui/button/Button";
import type { AvailabilitySlot } from "../../../../shared/types/domain";
import { formatBookingPrice } from "../../../booking/utils/booking-formatters";
import type {
  Appointment,
  AppointmentCreateFormValues,
  AppointmentEditFormValues,
  AppointmentManagerMode,
  AppointmentRescheduleFormValues,
  AppointmentsManagerProps,
} from "../types/appointments.types";

const personNameRegex = /^[A-Za-zÀ-ÿ' -]{2,80}$/;
const phoneRegex = /^[0-9+() -]{8,20}$/;

const createSchema: z.ZodType<AppointmentCreateFormValues> = z.object({
  serviceId: z.union([z.coerce.number().int().min(1, "Selecciona un servicio"), z.literal("")]),
  date: z.string().min(1, "Selecciona una fecha"),
  startTime: z.string().min(1, "Selecciona un horario"),
  firstName: z.string().trim().regex(personNameRegex, "Ingresa un nombre valido"),
  lastName: z.string().trim().regex(personNameRegex, "Ingresa un apellido valido"),
  phone: z.string().trim().regex(phoneRegex, "Ingresa un telefono valido"),
  email: z.union([z.literal(""), z.string().trim().max(120, "Email demasiado largo").email("Email invalido")]),
  clientNotes: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
});

const editSchema: z.ZodType<AppointmentEditFormValues> = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"]),
  firstName: z.string().trim().regex(personNameRegex, "Ingresa un nombre valido"),
  lastName: z.string().trim().regex(personNameRegex, "Ingresa un apellido valido"),
  phone: z.string().trim().regex(phoneRegex, "Ingresa un telefono valido"),
  email: z.union([z.literal(""), z.string().trim().max(120, "Email demasiado largo").email("Email invalido")]),
  clientNotes: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
  appointmentNotes: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
});

const rescheduleSchema: z.ZodType<AppointmentRescheduleFormValues> = z.object({
  date: z.string().min(1, "Selecciona una fecha"),
  startTime: z.string().min(1, "Selecciona un horario"),
});

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELED: "Cancelado",
  COMPLETED: "Realizado",
} as const;

const paymentStatusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  EXPIRED: "Vencido",
  CANCELLED: "Cancelado",
} as const;

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

interface InfoRowProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface EmptyManagerStateProps {
  message: string;
}

interface AppointmentCreateFormProps {
  form: UseFormReturn<AppointmentCreateFormValues>;
  services: AppointmentsManagerProps["services"];
  slots: AvailabilitySlot[];
  isLoadingSlots: boolean;
  isSubmitting: boolean;
  onSubmit: SubmitHandler<AppointmentCreateFormValues>;
}

interface AppointmentEditFormProps {
  form: UseFormReturn<AppointmentEditFormValues>;
  appointment: Appointment;
  isSubmitting: boolean;
  isDeleting: boolean;
  onSubmit: SubmitHandler<AppointmentEditFormValues>;
  onDelete: () => void;
}

interface AppointmentRescheduleFormProps {
  form: UseFormReturn<AppointmentRescheduleFormValues>;
  appointment: Appointment;
  slots: AvailabilitySlot[];
  isLoadingSlots: boolean;
  isSubmitting: boolean;
  onSubmit: SubmitHandler<AppointmentRescheduleFormValues>;
}

export function AppointmentsManager({
  services,
  mode,
  selectedAppointment,
  onModeChange,
  onCreate,
  onUpdate,
  onReschedule,
  onDelete,
  isSubmitting,
  isDeletingId,
  availableModes = ["create", "edit", "reschedule"],
}: AppointmentsManagerProps) {
  const [createSlots, setCreateSlots] = useState<AvailabilitySlot[]>([]);
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingCreateSlots, setIsLoadingCreateSlots] = useState(false);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);

  const createForm = useForm<AppointmentCreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      serviceId: services[0]?.id ?? "",
      date: dayjs().add(1, "day").format("YYYY-MM-DD"),
      startTime: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      clientNotes: "",
    },
  });

  const editForm = useForm<AppointmentEditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      status: "PENDING",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      clientNotes: "",
      appointmentNotes: "",
    },
  });

  const rescheduleForm = useForm<AppointmentRescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: "",
      startTime: "",
    },
  });

  const watchedCreateServiceId = createForm.watch("serviceId");
  const watchedCreateDate = createForm.watch("date");
  const watchedRescheduleDate = rescheduleForm.watch("date");

  const visibleModes = useMemo<AppointmentManagerMode[]>(
    () => availableModes.filter((value): value is AppointmentManagerMode => ["create", "edit", "reschedule"].includes(value)),
    [availableModes]
  );

  useEffect(() => {
    if (services.length && !createForm.getValues("serviceId")) {
      createForm.setValue("serviceId", services[0].id);
    }
  }, [services, createForm]);

  useEffect(() => {
    if (!selectedAppointment) {
      editForm.reset({
        status: "PENDING",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        clientNotes: "",
        appointmentNotes: "",
      });
      rescheduleForm.reset({ date: "", startTime: "" });
      return;
    }

    editForm.reset({
      status: selectedAppointment.status,
      firstName: selectedAppointment.client.firstName,
      lastName: selectedAppointment.client.lastName,
      phone: selectedAppointment.client.phone,
      email: selectedAppointment.client.email || "",
      clientNotes: selectedAppointment.client.notes || "",
      appointmentNotes: selectedAppointment.notes || "",
    });

    rescheduleForm.reset({
      date: selectedAppointment.date,
      startTime: "",
    });
  }, [selectedAppointment, editForm, rescheduleForm]);

  useEffect(() => {
    async function loadCreateSlots() {
      if (!watchedCreateServiceId || !watchedCreateDate) {
        setCreateSlots([]);
        return;
      }

      try {
        setIsLoadingCreateSlots(true);
        createForm.setValue("startTime", "");
        const response = await getAvailableSlots(watchedCreateServiceId, watchedCreateDate);
        setCreateSlots(response.slots);
      } catch {
        setCreateSlots([]);
        createForm.setValue("startTime", "");
        toast.error("No se pudo cargar la disponibilidad");
      } finally {
        setIsLoadingCreateSlots(false);
      }
    }

    if (visibleModes.includes("create")) {
      void loadCreateSlots();
    }
  }, [watchedCreateDate, watchedCreateServiceId, createForm, visibleModes]);

  useEffect(() => {
    async function loadRescheduleSlots() {
      if (!selectedAppointment || !watchedRescheduleDate) {
        setRescheduleSlots([]);
        return;
      }

      try {
        setIsLoadingRescheduleSlots(true);
        rescheduleForm.setValue("startTime", "");
        const response = await getAvailableSlots(selectedAppointment.serviceId, watchedRescheduleDate);
        setRescheduleSlots(response.slots);
      } catch {
        setRescheduleSlots([]);
        rescheduleForm.setValue("startTime", "");
        toast.error("No se pudo cargar la disponibilidad");
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    }

    if (visibleModes.includes("reschedule")) {
      void loadRescheduleSlots();
    }
  }, [selectedAppointment, watchedRescheduleDate, rescheduleForm, visibleModes]);

  const handleCreateSubmit: SubmitHandler<AppointmentCreateFormValues> = async (values) => {
    if (!values.serviceId) {
      return;
    }

    await onCreate(
      {
        serviceId: Number(values.serviceId),
        date: values.date,
        startTime: values.startTime,
        client: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          email: values.email || undefined,
          notes: values.clientNotes || undefined,
        },
      },
      () => {
        createForm.reset({
          serviceId: services[0]?.id ?? "",
          date: dayjs().add(1, "day").format("YYYY-MM-DD"),
          startTime: "",
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          clientNotes: "",
        });
        setCreateSlots([]);
      }
    );
  };

  const handleEditSubmit: SubmitHandler<AppointmentEditFormValues> = async (values) => {
    if (!selectedAppointment) {
      return;
    }

    await onUpdate(selectedAppointment.id, {
      status: values.status,
      notes: values.appointmentNotes || "",
      client: {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email || "",
        notes: values.clientNotes || "",
      },
    });
  };

  const handleRescheduleSubmit: SubmitHandler<AppointmentRescheduleFormValues> = async (values) => {
    if (!selectedAppointment) {
      return;
    }

    await onReschedule(selectedAppointment.id, values);
  };

  const modeTitle: Record<AppointmentManagerMode, string> = {
    create: "Alta manual de turnos",
    edit: "Editar datos del turno",
    reschedule: "Reprogramar turno",
  };

  const modeDescription =
    mode === "create"
      ? "Carga turnos manualmente para pacientes que reservan por telefono, WhatsApp o mostrador."
      : selectedAppointment
        ? `Turno #${selectedAppointment.id} - ${selectedAppointment.client.firstName} ${selectedAppointment.client.lastName}`
        : "Selecciona un turno desde gestion para continuar.";

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="card-surface overflow-hidden">
        <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-rose-50/60 to-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine shadow-sm">
                  {mode === "create" ? (
                    <CalendarCheck2 className="h-5 w-5" />
                  ) : mode === "edit" ? (
                    <FilePenLine className="h-5 w-5" />
                  ) : (
                    <CalendarClock className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                    Gestion puntual
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-brand-ink">{modeTitle[mode]}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{modeDescription}</p>
            </div>

            {visibleModes.length > 1 ? (
              <div className="flex flex-wrap gap-2 rounded-[1.35rem] border border-rose-100 bg-white/85 p-2 shadow-[0_18px_45px_-36px_rgba(148,70,88,0.5)]">
                {visibleModes.includes("create") ? (
                  <Button type="button" variant={mode === "create" ? "primary" : "secondary"} className="min-h-10 px-4 text-xs" onClick={() => onModeChange("create")}>
                    Nuevo manual
                  </Button>
                ) : null}
                {visibleModes.includes("edit") ? (
                  <Button type="button" variant={mode === "edit" ? "primary" : "secondary"} className="min-h-10 px-4 text-xs" disabled={!selectedAppointment} onClick={() => onModeChange("edit")}>
                    Editar
                  </Button>
                ) : null}
                {visibleModes.includes("reschedule") ? (
                  <Button type="button" variant={mode === "reschedule" ? "primary" : "secondary"} className="min-h-10 px-4 text-xs" disabled={!selectedAppointment} onClick={() => onModeChange("reschedule")}>
                    Reprogramar
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-6">
          {mode === "create" ? (
            <AppointmentCreateForm
              form={createForm}
              services={services}
              slots={createSlots}
              isLoadingSlots={isLoadingCreateSlots}
              isSubmitting={isSubmitting}
              onSubmit={handleCreateSubmit}
            />
          ) : null}

          {mode === "edit" ? (
            selectedAppointment ? (
              <AppointmentEditForm
                form={editForm}
                appointment={selectedAppointment}
                isSubmitting={isSubmitting}
                isDeleting={isDeletingId === selectedAppointment.id}
                onSubmit={handleEditSubmit}
                onDelete={() => onDelete(selectedAppointment.id)}
              />
            ) : (
              <EmptyManagerState message="Selecciona un turno desde gestion para editar datos del paciente y del turno." />
            )
          ) : null}

          {mode === "reschedule" ? (
            selectedAppointment ? (
              <AppointmentRescheduleForm
                form={rescheduleForm}
                appointment={selectedAppointment}
                slots={rescheduleSlots}
                isLoadingSlots={isLoadingRescheduleSlots}
                isSubmitting={isSubmitting}
                onSubmit={handleRescheduleSubmit}
              />
            ) : (
              <EmptyManagerState message="Selecciona un turno desde gestion para reprogramarlo con horarios reales disponibles." />
            )
          ) : null}
        </div>
      </div>

      <div className="card-surface overflow-hidden px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-semibold text-brand-ink">Contexto del turno</h3>
            <p className="mt-1 text-sm text-slate-600">
              Resumen rapido para editar, reprogramar o confirmar datos sin perder el contexto.
            </p>
          </div>
        </div>
        {selectedAppointment ? (
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <InfoRow label="Paciente" value={`${selectedAppointment.client.firstName} ${selectedAppointment.client.lastName}`} icon={UserRound} />
            <InfoRow label="Servicio" value={selectedAppointment.service.name} icon={Stethoscope} />
            <InfoRow label="Fecha" value={selectedAppointment.date} icon={CalendarCheck2} />
            <InfoRow label="Horario" value={`${selectedAppointment.startTime} - ${selectedAppointment.endTime}`} icon={Clock3} />
            <InfoRow label="Estado" value={statusLabels[selectedAppointment.status]} icon={FilePenLine} />
            <InfoRow
              label="Pago"
              value={paymentStatusLabels[selectedAppointment.paymentStatus]}
              icon={CreditCard}
            />
            <InfoRow
              label="Total servicio"
              value={formatBookingPrice(selectedAppointment.priceCents)}
              icon={CreditCard}
            />
            <InfoRow
              label="Sena reservada"
              value={formatBookingPrice(selectedAppointment.depositCents)}
              icon={CreditCard}
            />
            <InfoRow label="Telefono" value={selectedAppointment.client.phone} icon={PhoneCall} />
            <InfoRow label="Email" value={selectedAppointment.client.email || "Sin email"} icon={FilePenLine} />
            <InfoRow label="Notas cliente" value={selectedAppointment.client.notes || "Sin notas"} icon={FilePenLine} />
            <InfoRow label="Notas turno" value={selectedAppointment.notes || "Sin observaciones"} icon={FilePenLine} />
          </div>
        ) : (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/40 px-5 py-8 text-sm text-slate-500">
            Selecciona un turno en gestion para ver su detalle completo o editarlo desde aca.
          </div>
        )}
      </div>
    </section>
  );
}

function AppointmentCreateForm({ form, services, slots, isLoadingSlots, isSubmitting, onSubmit }: AppointmentCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-rose-100/80 bg-rose-50/55 px-4 py-4 text-sm text-slate-600">
        Usa este formulario para cargar turnos de mostrador, telefono o WhatsApp sin salir del
        flujo diario.
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Servicio" error={errors.serviceId?.message}>
          <select {...register("serviceId")} className="field-input">
            <option value="">Selecciona una opcion</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha" error={errors.date?.message}>
          <input type="date" {...register("date")} className="field-input" />
        </Field>
        <Field label="Horario" error={errors.startTime?.message}>
          <select {...register("startTime")} className="field-input" disabled={isLoadingSlots || slots.length === 0}>
            <option value="">
              {isLoadingSlots ? "Cargando..." : slots.length ? "Selecciona un horario" : "Sin horarios disponibles"}
            </option>
            {slots.map((slot) => (
              <option key={slot.startTime} value={slot.startTime}>
                {slot.startTime} - {slot.endTime}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" error={errors.firstName?.message}>
          <input type="text" {...register("firstName")} className="field-input" />
        </Field>
        <Field label="Apellido" error={errors.lastName?.message}>
          <input type="text" {...register("lastName")} className="field-input" />
        </Field>
        <Field label="Telefono" error={errors.phone?.message}>
          <input type="text" {...register("phone")} className="field-input" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className="field-input" />
        </Field>
      </div>

      <Field label="Notas del cliente" error={errors.clientNotes?.message}>
        <textarea {...register("clientNotes")} className="field-input min-h-24 resize-none py-3" />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando turno..." : "Crear turno manual"}
      </Button>
    </form>
  );
}

function AppointmentEditForm({ form, appointment, isSubmitting, isDeleting, onSubmit, onDelete }: AppointmentEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-rose-100/80 bg-rose-50/55 px-4 py-4 text-sm text-slate-600">
        Ajusta los datos del paciente y el estado del turno sin perder visibilidad de la agenda.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" error={errors.firstName?.message}>
          <input type="text" {...register("firstName")} className="field-input" />
        </Field>
        <Field label="Apellido" error={errors.lastName?.message}>
          <input type="text" {...register("lastName")} className="field-input" />
        </Field>
        <Field label="Telefono" error={errors.phone?.message}>
          <input type="text" {...register("phone")} className="field-input" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className="field-input" />
        </Field>
        <Field label="Estado" error={errors.status?.message}>
          <select {...register("status")} className="field-input">
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Servicio actual">
          <input type="text" value={appointment.service.name} className="field-input bg-slate-50" disabled />
        </Field>
      </div>

      <Field label="Notas del cliente" error={errors.clientNotes?.message}>
        <textarea {...register("clientNotes")} className="field-input min-h-24 resize-none py-3" />
      </Field>

      <Field label="Observaciones del turno" error={errors.appointmentNotes?.message}>
        <textarea {...register("appointmentNotes")} className="field-input min-h-24 resize-none py-3" />
      </Field>

      <div className="grid gap-3 md:grid-cols-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" className="w-full" disabled={isDeleting} onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Eliminando..." : "Eliminar turno"}
        </Button>
      </div>
    </form>
  );
}

function AppointmentRescheduleForm({ form, appointment, slots, isLoadingSlots, isSubmitting, onSubmit }: AppointmentRescheduleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/40 px-4 py-4 text-sm text-slate-600">
        <p>
          <strong className="text-brand-ink">Turno actual:</strong> {appointment.date} - {appointment.startTime} - {appointment.endTime}
        </p>
        <p className="mt-1">
          <strong className="text-brand-ink">Servicio:</strong> {appointment.service.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nueva fecha" error={errors.date?.message}>
          <input type="date" {...register("date")} className="field-input" />
        </Field>
        <Field label="Nuevo horario" error={errors.startTime?.message}>
          <select {...register("startTime")} className="field-input" disabled={isLoadingSlots || slots.length === 0}>
            <option value="">
              {isLoadingSlots ? "Cargando..." : slots.length ? "Selecciona un horario" : "Sin horarios disponibles"}
            </option>
            {slots.map((slot) => (
              <option key={slot.startTime} value={slot.startTime}>
                {slot.startTime} - {slot.endTime}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Reprogramando..." : "Confirmar reprogramacion"}
      </Button>
    </form>
  );
}

function EmptyManagerState({ message }: EmptyManagerStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/40 px-5 py-8 text-sm text-slate-500">
      {message}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: InfoRowProps) {
  return (
    <div className="rounded-[1.25rem] border border-rose-100/80 bg-white px-4 py-4 shadow-[0_18px_45px_-40px_rgba(148,70,88,0.35)]">
      <div className="flex items-center gap-2 text-brand-wine">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-bold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
