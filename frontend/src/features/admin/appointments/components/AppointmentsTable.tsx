import { useMemo, useState } from "react";
import clsx from "clsx";
import dayjs from "dayjs";
import {
  CalendarDays,
  CircleCheckBig,
  CircleDashed,
  CircleOff,
  FilterX,
  MoreHorizontal,
  PencilLine,
  Rows3,
  Search,
  TableProperties,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentsTableProps,
  AppointmentTableView,
} from "../types/appointments.types";

const statusOptions: ReadonlyArray<{ label: string; value: AppointmentStatus }> = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Cancelado", value: "CANCELED" },
  { label: "Realizado", value: "COMPLETED" },
];

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELED: "border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
};

const agendaBlocks = [
  { id: "morning", label: "Manana", min: 0, max: 12 },
  { id: "afternoon", label: "Tarde", min: 12, max: 17 },
  { id: "late", label: "Ultimos turnos", min: 17, max: 24 },
] as const;

interface SummaryPillProps {
  label: string;
  value: number;
  tone: string;
}

interface AgendaBlock {
  id: (typeof agendaBlocks)[number]["id"];
  label: string;
  min: number;
  max: number;
  items: Appointment[];
}

interface ActionIconButtonProps {
  ariaLabel: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

interface AppointmentActionMenuProps {
  appointment: Appointment;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectEdit: (appointment: Appointment) => void;
  onSelectReschedule: (appointment: Appointment) => void;
  onDeleteAppointment: (id: number) => void | Promise<void>;
  isDeletingId: number | null;
}

interface StatusQuickActionsProps {
  appointment: Appointment;
  isUpdatingId: number | null;
  onStatusChange: (id: number, status: AppointmentStatus) => void | Promise<void>;
}

export function AppointmentsTable({
  appointments,
  services,
  filters,
  onFiltersChange,
  onStatusChange,
  onSelectEdit,
  onSelectReschedule,
  onDeleteAppointment,
  isLoading,
  isUpdatingId,
  isDeletingId,
  selectedAppointmentId,
}: AppointmentsTableProps) {
  const [view, setView] = useState<AppointmentTableView>("timeline");
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  const summary = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter((appointment) => appointment.status === "PENDING").length,
      confirmed: appointments.filter((appointment) => appointment.status === "CONFIRMED").length,
      completed: appointments.filter((appointment) => appointment.status === "COMPLETED").length,
      canceled: appointments.filter((appointment) => appointment.status === "CANCELED").length,
    }),
    [appointments]
  );

  const groupedAppointments = useMemo<AgendaBlock[]>(
    () =>
      agendaBlocks.map((block) => ({
        ...block,
        items: appointments.filter((appointment) => {
          const hour = Number(appointment.startTime.split(":")[0]);
          return hour >= block.min && hour < block.max;
        }),
      })),
    [appointments]
  );

  const quickDateActions = [
    {
      label: "Hoy",
      nextFilters: {
        ...filters,
        dateFrom: dayjs().format("YYYY-MM-DD"),
        dateTo: dayjs().format("YYYY-MM-DD"),
      },
    },
    {
      label: "Manana",
      nextFilters: {
        ...filters,
        dateFrom: dayjs().add(1, "day").format("YYYY-MM-DD"),
        dateTo: dayjs().add(1, "day").format("YYYY-MM-DD"),
      },
    },
    {
      label: "Semana",
      nextFilters: {
        ...filters,
        dateFrom: dayjs().format("YYYY-MM-DD"),
        dateTo: dayjs().add(6, "day").format("YYYY-MM-DD"),
      },
    },
  ];

  const serviceSummary = useMemo<[string, number][]>(
    () => {
      const counts = appointments.reduce<Record<string, number>>((accumulator, appointment) => {
        accumulator[appointment.service.name] = (accumulator[appointment.service.name] || 0) + 1;
        return accumulator;
      }, {});

      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    },
    [appointments]
  );

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_24px_52px_-38px_rgba(90,64,74,0.22)]">
      <div className="border-b border-slate-200/80 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-brand-wine">
              Gestion diaria
            </p>
            <h3 className="mt-2 text-[1.7rem] font-semibold text-brand-ink">Agenda de turnos</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Una vista enfocada en filtrar rapido, detectar prioridades y actuar sin saturacion visual.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition",
                view === "timeline" ? "bg-brand-wine text-white" : "text-slate-500 hover:text-brand-wine"
              )}
            >
              <Rows3 size={15} />
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition",
                view === "table" ? "bg-brand-wine text-white" : "text-slate-500 hover:text-brand-wine"
              )}
            >
              <TableProperties size={15} />
              Tabla
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/80 bg-white px-5 py-5 md:px-6">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryPill label="Turnos en vista" value={summary.total} tone="text-brand-ink" />
          <SummaryPill label="Pendientes" value={summary.pending} tone="text-amber-700" />
          <SummaryPill label="Confirmados" value={summary.confirmed} tone="text-emerald-700" />
          <SummaryPill label="Realizados" value={summary.completed} tone="text-slate-700" />
          <SummaryPill label="Cancelados" value={summary.canceled} tone="text-rose-700" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Desde
              </span>
              <input
                type="date"
                data-testid="appointments-filter-date-from"
                value={filters.dateFrom}
                onChange={(event) => onFiltersChange({ ...filters, dateFrom: event.target.value })}
                className="field-input min-h-11 rounded-[1.1rem]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Hasta
              </span>
              <input
                type="date"
                data-testid="appointments-filter-date-to"
                value={filters.dateTo}
                onChange={(event) => onFiltersChange({ ...filters, dateTo: event.target.value })}
                className="field-input min-h-11 rounded-[1.1rem]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Estado
              </span>
              <select
                data-testid="appointments-filter-status"
                value={filters.status}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    status: (event.target.value as AppointmentStatus | "") || "",
                  })
                }
                className="field-input min-h-11 rounded-[1.1rem]"
              >
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Servicio
              </span>
              <select
                data-testid="appointments-filter-service"
                value={filters.serviceId}
                onChange={(event) => onFiltersChange({ ...filters, serviceId: event.target.value })}
                className="field-input min-h-11 rounded-[1.1rem]"
              >
                <option value="">Todos</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Cliente
              </span>
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  data-testid="appointments-filter-client"
                  value={filters.client}
                  onChange={(event) => onFiltersChange({ ...filters, client: event.target.value })}
                  className="field-input min-h-11 rounded-[1.1rem] pl-11"
                  placeholder="Nombre, apellido o telefono"
                />
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {quickDateActions.map((action) => (
              <button
                key={action.label}
                type="button"
                data-testid={`appointments-quick-${action.label.toLowerCase()}`}
                onClick={() => onFiltersChange(action.nextFilters)}
                className="inline-flex min-h-10 items-center rounded-full border border-rose-200 bg-rose-50/70 px-4 text-xs font-bold text-brand-wine transition hover:border-brand-rose hover:bg-white"
              >
                {action.label}
              </button>
            ))}
            <ActionIconButton
              ariaLabel="Limpiar filtros"
              title="Limpiar filtros"
              onClick={() =>
                onFiltersChange({
                  dateFrom: dayjs().format("YYYY-MM-DD"),
                  dateTo: dayjs().add(6, "day").format("YYYY-MM-DD"),
                  status: "",
                  client: "",
                  serviceId: "",
                })
              }
              className="border-rose-200 bg-white text-slate-500 hover:border-brand-rose hover:text-brand-wine"
            >
              <FilterX size={16} />
            </ActionIconButton>
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] bg-white text-brand-wine">
                <CalendarDays size={17} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Rango activo</p>
                <p className="mt-1.5 text-sm font-semibold text-brand-ink">
                  {filters.dateFrom ? dayjs(filters.dateFrom).format("DD/MM/YYYY") : "Sin inicio"} -{" "}
                  {filters.dateTo ? dayjs(filters.dateTo).format("DD/MM/YYYY") : "Sin fin"}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  {filters.serviceId ? "Filtrado por servicio especifico." : "Incluye todos los servicios activos."}{" "}
                  {filters.status ? `Estado: ${translateStatus(filters.status)}.` : "Sin restriccion por estado."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] bg-white text-brand-wine">
                <WandSparkles size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Servicios con mas movimiento
                </p>
                <div className="mt-2.5 space-y-1.5 text-sm text-slate-600">
                  {serviceSummary.length ? (
                    serviceSummary.map(([serviceName, count]) => (
                      <div key={serviceName} className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium text-brand-ink">{serviceName}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-brand-wine">
                          {count} turnos
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>No hay suficiente actividad para mostrar un ranking.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-10 text-sm text-slate-500">Cargando turnos...</div>
      ) : appointments.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">No hay turnos para los filtros seleccionados.</div>
      ) : view === "timeline" ? (
        <div className="grid gap-4 p-4 md:p-6 xl:grid-cols-3">
          {groupedAppointments.map((block) => (
            <section
              key={block.id}
              className="rounded-[1.45rem] border border-slate-200/80 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-wine">{block.label}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {block.items.length ? `${block.items.length} turnos` : "Sin turnos cargados"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {block.items.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
                    No hay actividad en este tramo horario.
                  </div>
                ) : (
                  block.items.map((appointment) => (
                    <article
                      key={appointment.id}
                      className={clsx(
                        "rounded-[1.2rem] border px-4 py-4 transition",
                        selectedAppointmentId === appointment.id
                          ? "border-brand-rose bg-rose-50/60"
                          : "border-slate-200/80 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-brand-ink">
                            {appointment.startTime} - {appointment.endTime}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-700">
                            {appointment.client.firstName} {appointment.client.lastName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{appointment.service.name}</p>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-slate-500">
                        <p>{appointment.client.phone}</p>
                        <p className="truncate">{appointment.client.email || "Sin email"}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 px-3 text-xs"
                          onClick={() => onSelectEdit(appointment)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 px-3 text-xs"
                          onClick={() => onSelectReschedule(appointment)}
                        >
                          Reprogramar
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 px-3 text-xs"
                          disabled={isDeletingId === appointment.id}
                          onClick={() => onDeleteAppointment(appointment.id)}
                        >
                          {isDeletingId === appointment.id ? "Eliminando..." : "Eliminar"}
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {statusOptions
                          .filter((status) => status.value !== appointment.status)
                          .map((status) => (
                            <button
                              key={status.value}
                              type="button"
                              disabled={isUpdatingId === appointment.id}
                              onClick={() => onStatusChange(appointment.id, status.value)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-brand-rose hover:text-brand-wine disabled:cursor-wait disabled:opacity-70"
                            >
                              {isUpdatingId === appointment.id ? "Actualizando..." : status.label}
                            </button>
                          ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto px-2 py-2 md:px-3">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Paciente</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Turno</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Servicio</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Estado</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Actualizacion</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em]">Gestion</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className={clsx(
                    "overflow-hidden rounded-[1.3rem] bg-white shadow-[0_14px_30px_-24px_rgba(90,64,74,0.2)]",
                    selectedAppointmentId === appointment.id && "ring-2 ring-rose-200"
                  )}
                >
                  <td className="rounded-l-[1.5rem] px-4 py-4">
                    <div className="min-w-[220px]">
                      <p className="font-semibold text-brand-ink">
                        {appointment.client.firstName} {appointment.client.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{appointment.client.phone}</p>
                      <p className="truncate text-xs text-slate-400">
                        {appointment.client.email || "Sin email"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-brand-ink">{dayjs(appointment.date).format("DD/MM/YYYY")}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="min-w-[160px]">
                      <p className="font-medium text-slate-700">{appointment.service.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusQuickActions
                      appointment={appointment}
                      isUpdatingId={isUpdatingId}
                      onStatusChange={onStatusChange}
                    />
                  </td>
                  <td className="rounded-r-[1.5rem] px-4 py-4">
                    <div className="flex justify-end">
                      <AppointmentActionMenu
                        appointment={appointment}
                        isOpen={openActionMenuId === appointment.id}
                        onToggle={() =>
                          setOpenActionMenuId((current) => (current === appointment.id ? null : appointment.id))
                        }
                        onClose={() => setOpenActionMenuId(null)}
                        onSelectEdit={onSelectEdit}
                        onSelectReschedule={onSelectReschedule}
                        onDeleteAppointment={onDeleteAppointment}
                        isDeletingId={isDeletingId}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value, tone }: SummaryPillProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={clsx("font-sans text-[1.35rem] font-semibold leading-none tracking-tight tabular-nums", tone)}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
        statusStyles[status]
      )}
    >
      {translateStatus(status)}
    </span>
  );
}

function StatusQuickActions({ appointment, isUpdatingId, onStatusChange }: StatusQuickActionsProps) {
  return (
    <div className="flex min-w-[190px] flex-wrap gap-2">
      {statusOptions
        .filter((status) => status.value !== appointment.status)
        .slice(0, 2)
        .map((status) => (
          <button
            key={status.value}
            type="button"
            disabled={isUpdatingId === appointment.id}
            onClick={() => onStatusChange(appointment.id, status.value)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-brand-rose hover:bg-white hover:text-brand-wine disabled:cursor-wait disabled:opacity-70"
          >
            {isUpdatingId === appointment.id ? "Actualizando..." : status.label}
          </button>
        ))}
    </div>
  );
}

function AppointmentActionMenu({
  appointment,
  isOpen,
  onToggle,
  onClose,
  onSelectEdit,
  onSelectReschedule,
  onDeleteAppointment,
  isDeletingId,
}: AppointmentActionMenuProps) {
  return (
    <div className="relative">
      <ActionIconButton
        ariaLabel={`Abrir acciones del turno ${appointment.id}`}
        title="Mas acciones"
        onClick={onToggle}
        className="border-slate-200 bg-white text-slate-500 hover:border-brand-rose hover:text-brand-wine"
      >
        <MoreHorizontal size={17} />
      </ActionIconButton>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 min-w-[190px] rounded-[1.1rem] border border-slate-200 bg-white p-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onSelectEdit(appointment);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-ink"
          >
            <PencilLine size={15} className="text-brand-wine" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectReschedule(appointment);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-ink"
          >
            <CalendarDays size={15} className="text-brand-wine" />
            Reprogramar
          </button>
          <button
            type="button"
            disabled={isDeletingId === appointment.id}
            onClick={() => {
              void onDeleteAppointment(appointment.id);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 size={15} />
            {isDeletingId === appointment.id ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ActionIconButton({
  ariaLabel,
  title,
  onClick,
  children,
  className,
}: ActionIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={clsx(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
        className
      )}
    >
      {children}
    </button>
  );
}

function translateStatus(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELED: "Cancelado",
    COMPLETED: "Realizado",
  };

  return labels[status];
}
