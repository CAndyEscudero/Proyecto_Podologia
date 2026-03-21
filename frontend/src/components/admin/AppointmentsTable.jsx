import clsx from "clsx";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Button } from "../../shared/ui/button/Button";

const statusOptions = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Cancelado", value: "CANCELED" },
  { label: "Realizado", value: "COMPLETED" },
];

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELED: "bg-rose-50 text-rose-700 border-rose-100",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
};

const agendaBlocks = [
  { id: "morning", label: "Manana", min: 0, max: 12 },
  { id: "afternoon", label: "Tarde", min: 12, max: 17 },
  { id: "late", label: "Ultimos turnos", min: 17, max: 24 },
];

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
}) {
  const [view, setView] = useState("timeline");

  const summary = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((appointment) => appointment.status === "PENDING").length,
      confirmed: appointments.filter((appointment) => appointment.status === "CONFIRMED").length,
      completed: appointments.filter((appointment) => appointment.status === "COMPLETED").length,
      canceled: appointments.filter((appointment) => appointment.status === "CANCELED").length,
    };
  }, [appointments]);

  const groupedAppointments = useMemo(() => {
    return agendaBlocks.map((block) => ({
      ...block,
      items: appointments.filter((appointment) => {
        const hour = Number(appointment.startTime.split(":")[0]);
        return hour >= block.min && hour < block.max;
      }),
    }));
  }, [appointments]);

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

  const serviceSummary = useMemo(() => {
    const counts = appointments.reduce((accumulator, appointment) => {
      accumulator[appointment.service.name] = (accumulator[appointment.service.name] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [appointments]);

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-rose-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-brand-ink">Agenda y gestion de turnos</h3>
            <p className="mt-2 text-sm text-slate-600">
              Vista diaria pensada para operar la agenda con mas rapidez y menos friccion.
            </p>
          </div>

          <div className="rounded-full border border-rose-200 bg-white p-1">
            {[
              { id: "timeline", label: "Agenda" },
              { id: "table", label: "Tabla" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setView(option.id)}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-bold transition",
                  view === option.id ? "bg-brand-wine text-white" : "text-slate-500 hover:text-brand-wine"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-rose-100 bg-rose-50/40 px-6 py-5 xl:grid-cols-[1fr_1fr_1fr_1fr_1.3fr_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-brand-ink">Desde</span>
          <input
            type="date"
            data-testid="appointments-filter-date-from"
            value={filters.dateFrom}
            onChange={(event) => onFiltersChange({ ...filters, dateFrom: event.target.value })}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-brand-ink">Hasta</span>
          <input
            type="date"
            data-testid="appointments-filter-date-to"
            value={filters.dateTo}
            onChange={(event) => onFiltersChange({ ...filters, dateTo: event.target.value })}
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-brand-ink">Estado</span>
          <select
            data-testid="appointments-filter-status"
            value={filters.status}
            onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
            className="field-input"
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
          <span className="mb-2 block text-sm font-semibold text-brand-ink">Servicio</span>
          <select
            data-testid="appointments-filter-service"
            value={filters.serviceId}
            onChange={(event) => onFiltersChange({ ...filters, serviceId: event.target.value })}
            className="field-input"
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
          <span className="mb-2 block text-sm font-semibold text-brand-ink">Cliente</span>
          <input
            type="text"
            data-testid="appointments-filter-client"
            value={filters.client}
            onChange={(event) => onFiltersChange({ ...filters, client: event.target.value })}
            className="field-input"
            placeholder="Nombre, apellido o telefono"
          />
        </label>

        <div className="flex flex-wrap items-end gap-2 xl:justify-end">
          {quickDateActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="secondary"
              data-testid={`appointments-quick-${action.label.toLowerCase()}`}
              className="min-h-10 px-4 text-xs"
              onClick={() => onFiltersChange(action.nextFilters)}
            >
              {action.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="secondary"
            data-testid="appointments-filter-clear"
            className="min-h-10 px-4 text-xs"
            onClick={() =>
              onFiltersChange({
                dateFrom: dayjs().format("YYYY-MM-DD"),
                dateTo: dayjs().add(6, "day").format("YYYY-MM-DD"),
                status: "",
                client: "",
                serviceId: "",
              })
            }
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 border-b border-rose-100 bg-white px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
        <SummaryPill label="Turnos en vista" value={summary.total} tone="text-brand-wine" />
        <SummaryPill label="Pendientes" value={summary.pending} tone="text-amber-700" />
        <SummaryPill label="Confirmados" value={summary.confirmed} tone="text-emerald-700" />
        <SummaryPill label="Realizados" value={summary.completed} tone="text-slate-700" />
        <SummaryPill label="Cancelados" value={summary.canceled} tone="text-rose-700" />
      </div>

      <div className="grid gap-3 border-b border-rose-100 bg-white px-6 py-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50/40 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Rango activo</p>
          <p className="mt-3 text-sm font-semibold text-brand-ink">
            {filters.dateFrom ? dayjs(filters.dateFrom).format("DD/MM/YYYY") : "Sin inicio"}{" "}
            {" - "}
            {filters.dateTo ? dayjs(filters.dateTo).format("DD/MM/YYYY") : "Sin fin"}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {filters.serviceId ? "Filtrado por servicio especifico." : "Incluye todos los servicios activos."}
            {" "}
            {filters.status ? `Estado: ${translateStatus(filters.status)}.` : "Sin restriccion por estado."}
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50/40 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Servicios con mas movimiento</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {serviceSummary.length ? (
              serviceSummary.map(([serviceName, count]) => (
                <div key={serviceName} className="flex items-center justify-between gap-3">
                  <span className="font-medium text-brand-ink">{serviceName}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-wine">
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

      {isLoading ? (
        <div className="px-6 py-10 text-sm text-slate-500">Cargando turnos...</div>
      ) : appointments.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">No hay turnos para los filtros seleccionados.</div>
      ) : view === "timeline" ? (
        <div className="grid gap-5 p-6 xl:grid-cols-3">
          {groupedAppointments.map((block) => (
            <section key={block.id} className="rounded-[1.75rem] border border-rose-100 bg-white p-4">
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
                  <div className="rounded-[1.25rem] border border-dashed border-rose-200 bg-rose-50/40 px-4 py-5 text-sm text-slate-500">
                    No hay actividad en este tramo horario.
                  </div>
                ) : (
                  block.items.map((appointment) => (
                    <article
                      key={appointment.id}
                      className={clsx(
                        "rounded-[1.5rem] border px-4 py-4 transition",
                        selectedAppointmentId === appointment.id
                          ? "border-brand-rose bg-rose-50/70 shadow-soft"
                          : "border-rose-100 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-brand-ink">
                            {appointment.startTime} - {appointment.endTime}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {appointment.client.firstName} {appointment.client.lastName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{appointment.service.name}</p>
                        </div>
                        <span
                          className={clsx(
                            "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                            statusStyles[appointment.status] || "bg-rose-50 text-brand-wine border-rose-100"
                          )}
                        >
                          {translateStatus(appointment.status)}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <p>{appointment.client.phone}</p>
                        <p>{appointment.client.email || "Sin email"}</p>
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
                            <Button
                              key={status.value}
                              type="button"
                              variant="secondary"
                              className="min-h-10 px-3 text-[11px]"
                              disabled={isUpdatingId === appointment.id}
                              onClick={() => onStatusChange(appointment.id, status.value)}
                            >
                              {isUpdatingId === appointment.id ? "Actualizando..." : status.label}
                            </Button>
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white text-slate-500">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Horario</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
                <th className="px-6 py-4">Gestion</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className={clsx(
                    "border-t border-rose-100/80 align-top",
                    selectedAppointmentId === appointment.id && "bg-rose-50/40"
                  )}
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-brand-ink">
                      {appointment.client.firstName} {appointment.client.lastName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{appointment.client.phone}</p>
                    <p className="text-xs text-slate-500">{appointment.client.email || "Sin email"}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{appointment.service.name}</td>
                  <td className="px-6 py-4 text-slate-600">{appointment.date}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {appointment.startTime} - {appointment.endTime}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={clsx(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                        statusStyles[appointment.status] || "bg-rose-50 text-brand-wine border-rose-100"
                      )}
                    >
                      {translateStatus(appointment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {statusOptions
                        .filter((status) => status.value !== appointment.status)
                        .map((status) => (
                          <Button
                            key={status.value}
                            type="button"
                            variant="secondary"
                            className="min-h-10 px-3 text-xs"
                            disabled={isUpdatingId === appointment.id}
                            onClick={() => onStatusChange(appointment.id, status.value)}
                          >
                            {isUpdatingId === appointment.id ? "Actualizando..." : status.label}
                          </Button>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
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

function SummaryPill({ label, value, tone }) {
  return (
    <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50/40 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={clsx("mt-3 font-sans text-[2rem] font-semibold leading-none tracking-tight tabular-nums", tone)}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function translateStatus(status) {
  const labels = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELED: "Cancelado",
    COMPLETED: "Realizado",
  };

  return labels[status] || status;
}
