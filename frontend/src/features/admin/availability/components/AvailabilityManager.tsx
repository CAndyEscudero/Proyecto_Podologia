import dayjs from "dayjs";
import clsx from "clsx";
import { z } from "zod";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CalendarClock, Clock3, Coffee, PencilLine, Trash2 } from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import type {
  AvailabilityRule,
  AvailabilityRuleFormValues,
  BlockedDate,
  BlockedDateFormValues,
  CreateAvailabilityRulePayload,
  CreateBlockedDatePayload,
  UpdateAvailabilityRulePayload,
} from "../types/availability.types";

const ruleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  type: z.enum(["WORKING_HOURS", "BREAK"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora invalida"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora invalida"),
});

const blockedDateSchema = z.object({
  date: z.string().min(1, "Selecciona una fecha"),
  reason: z.string().max(180, "Maximo 180 caracteres").optional().or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
});

const ruleDefaults: AvailabilityRuleFormValues = {
  dayOfWeek: 1,
  type: "WORKING_HOURS",
  startTime: "09:00",
  endTime: "13:00",
};

const blockedDateDefaults: BlockedDateFormValues = {
  date: dayjs().add(1, "day").format("YYYY-MM-DD"),
  reason: "",
  startTime: "",
  endTime: "",
};

const days = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"] as const;
const dayOptions = [1, 2, 3, 4, 5, 6, 0] as const;
const ruleLabels: Record<AvailabilityRule["type"], string> = {
  WORKING_HOURS: "Horario laboral",
  BREAK: "Pausa",
};
type AvailabilityView = "rules" | "blockedDates";

interface AvailabilityManagerProps {
  rules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  onCreateRule: (payload: CreateAvailabilityRulePayload, onSuccess?: () => void) => void;
  onUpdateRule: (id: number, payload: UpdateAvailabilityRulePayload, onSuccess?: () => void) => void;
  onDeleteRule: (id: number) => void;
  onCreateBlockedDate: (payload: CreateBlockedDatePayload, onSuccess?: () => void) => void;
  onDeleteBlockedDate: (id: number) => void;
  isSavingRule: boolean;
  isDeletingRuleId: number | null;
  isSavingBlockedDate: boolean;
  isDeletingBlockedDateId: number | null;
  editingRule: AvailabilityRule | null;
  onEditRule: (rule: AvailabilityRule) => void;
  onCancelEditRule: () => void;
}

export function AvailabilityManager({
  rules,
  blockedDates,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onCreateBlockedDate,
  onDeleteBlockedDate,
  isSavingRule,
  isDeletingRuleId,
  isSavingBlockedDate,
  isDeletingBlockedDateId,
  editingRule,
  onEditRule,
  onCancelEditRule,
}: AvailabilityManagerProps) {
  const {
    register: registerRule,
    handleSubmit: handleSubmitRule,
    reset: resetRule,
    formState: { errors: ruleErrors },
  } = useForm<AvailabilityRuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: ruleDefaults,
  });

  const {
    register: registerBlockedDate,
    handleSubmit: handleSubmitBlockedDate,
    reset: resetBlockedDate,
    watch: watchBlockedDate,
    formState: { errors: blockedDateErrors },
  } = useForm<BlockedDateFormValues>({
    resolver: zodResolver(blockedDateSchema),
    defaultValues: blockedDateDefaults,
  });

  useEffect(() => {
    if (editingRule) {
      resetRule({
        dayOfWeek: editingRule.dayOfWeek,
        type: editingRule.type,
        startTime: editingRule.startTime,
        endTime: editingRule.endTime,
      });
      return;
    }

    resetRule(ruleDefaults);
  }, [editingRule, resetRule]);

  const hasPartialBlock = Boolean(watchBlockedDate("startTime") || watchBlockedDate("endTime"));
  const [activeView, setActiveView] = useState<AvailabilityView>("rules");

  useEffect(() => {
    if (editingRule) {
      setActiveView("rules");
    }
  }, [editingRule]);

  const sortedRules = useMemo(
    () =>
      [...rules].sort((a, b) => {
        const dayDiff = a.dayOfWeek - b.dayOfWeek;

        if (dayDiff !== 0) {
          return dayDiff;
        }

        const timeDiff = a.startTime.localeCompare(b.startTime);

        if (timeDiff !== 0) {
          return timeDiff;
        }

        return a.type.localeCompare(b.type);
      }),
    [rules]
  );

  const rulesByDay = useMemo(
    () =>
      dayOptions
        .map((dayOfWeek) => ({
          dayOfWeek,
          label: days[dayOfWeek],
          items: sortedRules.filter((rule) => rule.dayOfWeek === dayOfWeek),
        }))
        .filter((group) => group.items.length > 0),
    [sortedRules]
  );

  const sortedBlockedDates = useMemo(
    () =>
      [...blockedDates].sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      }),
    [blockedDates]
  );

  const workingRulesCount = rules.filter((rule) => rule.type === "WORKING_HOURS").length;
  const breakRulesCount = rules.filter((rule) => rule.type === "BREAK").length;
  const fullDayBlocksCount = blockedDates.filter((blockedDate) => !blockedDate.startTime && !blockedDate.endTime).length;
  const partialBlocksCount = blockedDates.length - fullDayBlocksCount;
  const coveredDaysCount = new Set(
    rules.filter((rule) => rule.type === "WORKING_HOURS").map((rule) => rule.dayOfWeek)
  ).size;

  const summaryItems =
    activeView === "rules"
      ? [
          {
            label: "Reglas activas",
            value: String(rules.length).padStart(2, "0"),
            icon: <Clock3 className="h-4 w-4" />,
          },
          {
            label: "Pausas",
            value: String(breakRulesCount).padStart(2, "0"),
            icon: <Coffee className="h-4 w-4" />,
          },
          {
            label: "Dias cubiertos",
            value: String(coveredDaysCount).padStart(2, "0"),
            icon: <CalendarClock className="h-4 w-4" />,
          },
        ]
      : [
          {
            label: "Bloqueos",
            value: String(blockedDates.length).padStart(2, "0"),
            icon: <Ban className="h-4 w-4" />,
          },
          {
            label: "Dia completo",
            value: String(fullDayBlocksCount).padStart(2, "0"),
            icon: <CalendarClock className="h-4 w-4" />,
          },
          {
            label: "Por franja",
            value: String(partialBlocksCount).padStart(2, "0"),
            icon: <Clock3 className="h-4 w-4" />,
          },
        ];

  function submitRule(values: AvailabilityRuleFormValues): void {
    if (editingRule) {
      onUpdateRule(editingRule.id, values, () => resetRule(ruleDefaults));
      return;
    }

    onCreateRule(values, () => resetRule(ruleDefaults));
  }

  function submitBlockedDate(values: BlockedDateFormValues): void {
    const payload = {
      date: values.date,
      reason: values.reason || undefined,
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
    };

    onCreateBlockedDate(payload, () => resetBlockedDate(blockedDateDefaults));
  }

  const rulesView = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_360px]">
      <div className="overflow-hidden rounded-[1.45rem] border border-slate-200/80 bg-white shadow-[0_18px_36px_-32px_rgba(90,64,74,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-wine/80">Vista semanal</p>
            <p className="mt-1 text-sm text-slate-600">Horarios laborales y pausas ordenados por dia.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {rules.length} registros
          </span>
        </div>

        {rulesByDay.length === 0 ? (
          <div className="px-5 py-10 text-sm text-slate-500">
            Todavia no hay horarios cargados. Crea una regla para definir dias abiertos o pausas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100/90">
            {rulesByDay.map((group) => (
              <section key={group.dayOfWeek} className="px-5 py-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-brand-ink">{group.label}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {group.items.length} bloques
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {group.items.map((rule) => (
                    <article
                      key={rule.id}
                      className={clsx(
                        "rounded-[1.15rem] border px-4 py-4 transition",
                        editingRule?.id === rule.id
                          ? "border-rose-200 bg-rose-50/60"
                          : "border-slate-200 bg-slate-50/65 hover:bg-white"
                      )}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-wine">
                            {rule.type === "BREAK" ? (
                              <Coffee className="h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}
                            {ruleLabels[rule.type]}
                          </span>
                          <p className="mt-2 text-base font-semibold text-brand-ink">
                            {rule.startTime} - {rule.endTime}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {rule.type === "BREAK"
                              ? "Esta franja se descuenta del calculo de turnos disponibles."
                              : "Franja habilitada para mostrar slots en la agenda."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={editingRule?.id === rule.id ? "primary" : "secondary"}
                            className="min-h-10 px-4 text-xs"
                            onClick={() => onEditRule(rule)}
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            {editingRule?.id === rule.id ? "Editando" : "Editar"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-10 px-4 text-xs"
                            disabled={isDeletingRuleId === rule.id}
                            onClick={() => onDeleteRule(rule.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeletingRuleId === rule.id ? "Eliminando..." : "Eliminar"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.45rem] border border-slate-200/80 bg-slate-50/55 p-5 shadow-[0_18px_36px_-32px_rgba(90,64,74,0.2)] xl:sticky xl:top-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine/85">
              {editingRule ? "Editar bloque" : "Nueva regla"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-brand-ink">
              {editingRule ? `${days[editingRule.dayOfWeek]} ${editingRule.startTime}` : "Carga una regla semanal"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Define si la franja abre agenda o si representa una pausa operativa.
            </p>
          </div>
          {editingRule ? (
            <button
              type="button"
              onClick={onCancelEditRule}
              className="text-sm font-semibold text-slate-500 transition hover:text-brand-wine"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmitRule(submitRule)} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Dia</span>
            <select {...registerRule("dayOfWeek")} className="field-input">
              {dayOptions.map((dayOfWeek) => (
                <option key={dayOfWeek} value={dayOfWeek}>
                  {days[dayOfWeek]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Tipo</span>
            <select {...registerRule("type")} className="field-input">
              <option value="WORKING_HOURS">Horario laboral</option>
              <option value="BREAK">Pausa</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Desde</span>
              <input type="time" {...registerRule("startTime")} className="field-input" />
              {ruleErrors.startTime ? (
                <span className="mt-2 block text-xs text-red-500">{ruleErrors.startTime.message}</span>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Hasta</span>
              <input type="time" {...registerRule("endTime")} className="field-input" />
              {ruleErrors.endTime ? (
                <span className="mt-2 block text-xs text-red-500">{ruleErrors.endTime.message}</span>
              ) : null}
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isSavingRule}>
            {isSavingRule ? "Guardando..." : editingRule ? "Guardar cambios" : "Crear regla"}
          </Button>
        </form>
      </div>
    </div>
  );

  const blockedDatesView = (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <form
        onSubmit={handleSubmitBlockedDate(submitBlockedDate)}
        className="rounded-[1.45rem] border border-slate-200/80 bg-slate-50/55 p-5 shadow-[0_18px_36px_-32px_rgba(90,64,74,0.2)] xl:sticky xl:top-6"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine/85">Nueva excepcion</p>
          <h3 className="mt-2 text-xl font-semibold text-brand-ink">Bloquear fecha o franja</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Usa este formulario para cortar dias completos o una ventana puntual de la agenda.
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Fecha</span>
            <input type="date" {...registerBlockedDate("date")} className="field-input" />
            {blockedDateErrors.date ? (
              <span className="mt-2 block text-xs text-red-500">{blockedDateErrors.date.message}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Motivo</span>
            <input
              type="text"
              {...registerBlockedDate("reason")}
              className="field-input"
              placeholder="Feriado, cierre, capacitacion"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Desde</span>
              <input type="time" {...registerBlockedDate("startTime")} className="field-input" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Hasta</span>
              <input type="time" {...registerBlockedDate("endTime")} className="field-input" />
            </label>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            {hasPartialBlock
              ? "Con horario cargado, se bloquea solo esa franja puntual."
              : "Si dejas ambas horas vacias, se bloquea el dia completo."}
          </p>

          <Button type="submit" className="w-full" disabled={isSavingBlockedDate}>
            {isSavingBlockedDate ? "Guardando..." : "Bloquear fecha"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[1.45rem] border border-slate-200/80 bg-white shadow-[0_18px_36px_-32px_rgba(90,64,74,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-wine/80">
              Calendario de excepciones
            </p>
            <p className="mt-1 text-sm text-slate-600">Feriados, cierres y bloqueos puntuales ordenados por fecha.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {blockedDates.length} registros
          </span>
        </div>

        {sortedBlockedDates.length === 0 ? (
          <div className="px-5 py-10 text-sm text-slate-500">
            No hay bloqueos cargados todavia. Cuando agregues uno, lo veras listado aca.
          </div>
        ) : (
          <div className="divide-y divide-slate-100/90">
            {sortedBlockedDates.map((blockedDate) => {
              const normalizedDate = String(blockedDate.date).slice(0, 10);
              const dateLabel = dayjs(normalizedDate).format("DD/MM/YYYY");
              const dayLabel = days[dayjs(normalizedDate).day()];
              const rangeLabel =
                blockedDate.startTime && blockedDate.endTime
                  ? `${blockedDate.startTime} - ${blockedDate.endTime}`
                  : "Dia completo";

              return (
                <article
                  key={blockedDate.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50/70 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-brand-ink">{dateLabel}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {dayLabel}
                      </span>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-wine">
                        {rangeLabel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{blockedDate.reason || "Sin motivo especificado"}</p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-10 px-4 text-xs md:self-center"
                    disabled={isDeletingBlockedDateId === blockedDate.id}
                    onClick={() => onDeleteBlockedDate(blockedDate.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeletingBlockedDateId === blockedDate.id ? "Eliminando..." : "Quitar bloqueo"}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_22px_50px_-36px_rgba(90,64,74,0.2)]">
        <div className="border-b border-slate-200/80 px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-brand-wine">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                    Disponibilidad operativa
                  </p>
                  <h2 className="mt-1 text-[1.7rem] font-semibold text-brand-ink">Agenda y excepciones</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Separa horarios base de bloqueos puntuales para que el equipo entienda rapido que
                dias estan abiertos, donde hay pausas y cuando la agenda no debe ofrecer turnos.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white px-5 py-5 md:px-6">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {summaryItems.map((item) => (
              <MetricPill key={item.label} label={item.label} value={item.value} icon={item.icon} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveView("rules")}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition",
                activeView === "rules" ? "bg-brand-wine text-white" : "text-slate-500 hover:text-brand-wine"
              )}
            >
              <Clock3 size={15} />
              Agenda base
            </button>
            <button
              type="button"
              onClick={() => setActiveView("blockedDates")}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition",
                activeView === "blockedDates"
                  ? "bg-brand-wine text-white"
                  : "text-slate-500 hover:text-brand-wine"
              )}
            >
              <Ban size={15} />
              Fechas bloqueadas
            </button>
          </div>
        </div>
      </div>

      {activeView === "rules" ? rulesView : blockedDatesView}
    </section>
  );
}

interface MetricPillProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function MetricPill({ label, value, icon }: MetricPillProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
      <div>
        <div className="flex items-center gap-2 text-brand-wine">
          {icon}
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</p>
        </div>
        <p className="mt-1 text-lg font-semibold text-brand-ink">{value}</p>
      </div>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] bg-white text-brand-wine">
        {icon}
      </span>
    </div>
  );
}
