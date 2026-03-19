import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getAvailableSlots } from "../../services/adminApi";
import { Button } from "../ui/Button";

const personNameRegex = /^[A-Za-zÀ-ÿ' -]{2,80}$/;
const phoneRegex = /^[0-9+() -]{8,20}$/;

const createSchema = z.object({
  serviceId: z.coerce.number().int().min(1, "Selecciona un servicio"),
  date: z.string().min(1, "Selecciona una fecha"),
  startTime: z.string().min(1, "Selecciona un horario"),
  firstName: z.string().trim().regex(personNameRegex, "Ingresa un nombre valido"),
  lastName: z.string().trim().regex(personNameRegex, "Ingresa un apellido valido"),
  phone: z.string().trim().regex(phoneRegex, "Ingresa un telefono valido"),
  email: z.union([z.literal(""), z.string().trim().max(120, "Email demasiado largo").email("Email invalido")]),
  clientNotes: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
});

const editSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"]),
  firstName: z.string().trim().regex(personNameRegex, "Ingresa un nombre valido"),
  lastName: z.string().trim().regex(personNameRegex, "Ingresa un apellido valido"),
  phone: z.string().trim().regex(phoneRegex, "Ingresa un telefono valido"),
  email: z.union([z.literal(""), z.string().trim().max(120, "Email demasiado largo").email("Email invalido")]),
  clientNotes: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
  appointmentNotes: z.string().trim().max(1000, "Maximo 1000 caracteres").optional(),
});

const rescheduleSchema = z.object({
  date: z.string().min(1, "Selecciona una fecha"),
  startTime: z.string().min(1, "Selecciona un horario"),
});

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELED: "Cancelado",
  COMPLETED: "Realizado",
};

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
}) {
  const [createSlots, setCreateSlots] = useState([]);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [isLoadingCreateSlots, setIsLoadingCreateSlots] = useState(false);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);

  const createForm = useForm({
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

  const editForm = useForm({
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

  const rescheduleForm = useForm({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: "",
      startTime: "",
    },
  });

  const watchedCreateServiceId = createForm.watch("serviceId");
  const watchedCreateDate = createForm.watch("date");
  const watchedRescheduleDate = rescheduleForm.watch("date");

  const visibleModes = useMemo(
    () => availableModes.filter((value) => ["create", "edit", "reschedule"].includes(value)),
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
      } catch (error) {
        setCreateSlots([]);
        createForm.setValue("startTime", "");
        toast.error(error?.response?.data?.message || "No se pudo cargar la disponibilidad");
      } finally {
        setIsLoadingCreateSlots(false);
      }
    }

    if (visibleModes.includes("create")) {
      loadCreateSlots();
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
      } catch (error) {
        setRescheduleSlots([]);
        rescheduleForm.setValue("startTime", "");
        toast.error(error?.response?.data?.message || "No se pudo cargar la disponibilidad");
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    }

    if (visibleModes.includes("reschedule")) {
      loadRescheduleSlots();
    }
  }, [selectedAppointment, watchedRescheduleDate, rescheduleForm, visibleModes]);

  async function handleCreateSubmit(values) {
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
  }

  async function handleEditSubmit(values) {
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
  }

  async function handleRescheduleSubmit(values) {
    if (!selectedAppointment) {
      return;
    }

    await onReschedule(selectedAppointment.id, values);
  }

  const modeTitle = {
    create: "Alta manual de turnos",
    edit: "Editar datos del turno",
    reschedule: "Reprogramar turno",
  };

  const modeDescription =
    mode === "create"
      ? "Carga turnos manualmente para pacientes que reservan por telefono, WhatsApp o mostrador."
      : selectedAppointment
        ? `Turno #${selectedAppointment.id} · ${selectedAppointment.client.firstName} ${selectedAppointment.client.lastName}`
        : "Selecciona un turno desde gestion para continuar.";

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="card-surface overflow-hidden">
        <div className="border-b border-rose-100 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-brand-ink">{modeTitle[mode]}</h2>
              <p className="mt-2 text-sm text-slate-600">{modeDescription}</p>
            </div>

            {visibleModes.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {visibleModes.includes("create") ? (
                  <Button
                    type="button"
                    variant={mode === "create" ? "primary" : "secondary"}
                    className="min-h-10 px-4 text-xs"
                    onClick={() => onModeChange("create")}
                  >
                    Nuevo manual
                  </Button>
                ) : null}
                {visibleModes.includes("edit") ? (
                  <Button
                    type="button"
                    variant={mode === "edit" ? "primary" : "secondary"}
                    className="min-h-10 px-4 text-xs"
                    disabled={!selectedAppointment}
                    onClick={() => onModeChange("edit")}
                  >
                    Editar
                  </Button>
                ) : null}
                {visibleModes.includes("reschedule") ? (
                  <Button
                    type="button"
                    variant={mode === "reschedule" ? "primary" : "secondary"}
                    className="min-h-10 px-4 text-xs"
                    disabled={!selectedAppointment}
                    onClick={() => onModeChange("reschedule")}
                  >
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

      <div className="card-surface px-6 py-5">
        <h3 className="text-xl font-semibold text-brand-ink">Contexto del turno</h3>
        {selectedAppointment ? (
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <InfoRow label="Paciente" value={`${selectedAppointment.client.firstName} ${selectedAppointment.client.lastName}`} />
            <InfoRow label="Servicio" value={selectedAppointment.service.name} />
            <InfoRow label="Fecha" value={selectedAppointment.date} />
            <InfoRow label="Horario" value={`${selectedAppointment.startTime} - ${selectedAppointment.endTime}`} />
            <InfoRow label="Estado" value={statusLabels[selectedAppointment.status]} />
            <InfoRow label="Telefono" value={selectedAppointment.client.phone} />
            <InfoRow label="Email" value={selectedAppointment.client.email || "Sin email"} />
            <InfoRow label="Notas cliente" value={selectedAppointment.client.notes || "Sin notas"} />
            <InfoRow label="Notas turno" value={selectedAppointment.notes || "Sin observaciones"} />
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

function AppointmentCreateForm({ form, services, slots, isLoadingSlots, isSubmitting, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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

function AppointmentEditForm({ form, appointment, isSubmitting, isDeleting, onSubmit, onDelete }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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
          {isDeleting ? "Eliminando..." : "Eliminar turno"}
        </Button>
      </div>
    </form>
  );
}

function AppointmentRescheduleForm({ form, appointment, slots, isLoadingSlots, isSubmitting, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/40 px-4 py-4 text-sm text-slate-600">
        <p>
          <strong className="text-brand-ink">Turno actual:</strong> {appointment.date} · {appointment.startTime} - {appointment.endTime}
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

function EmptyManagerState({ message }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/40 px-5 py-8 text-sm text-slate-500">
      {message}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-wine">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
