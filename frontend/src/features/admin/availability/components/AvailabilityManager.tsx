import dayjs from "dayjs";
import { z } from "zod";
import { useEffect, type ReactNode } from "react";
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
const ruleLabels: Record<AvailabilityRule["type"], string> = {
  WORKING_HOURS: "Horario laboral",
  BREAK: "Pausa",
};

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

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="card-surface overflow-hidden">
        <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-rose-50/60 to-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine shadow-sm">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                    Agenda base
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-brand-ink">Disponibilidad semanal</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Define horarios laborales y pausas para que el calculo de slots respete la
                operativa real sin sobrecargar al recepcionista.
              </p>
            </div>

            <div className="grid min-w-[240px] gap-3 rounded-[1.5rem] border border-rose-100 bg-white/85 p-4 shadow-[0_18px_45px_-36px_rgba(148,70,88,0.5)] sm:grid-cols-2">
              <MetricPill label="Reglas" value={String(rules.length)} icon={<Clock3 className="h-4 w-4" />} />
              <MetricPill label="Bloqueos" value={String(blockedDates.length)} icon={<Ban className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 min-[1400px]:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-3">
            {rules.length === 0 ? (
              <div className="rounded-[1.5rem] border border-rose-100 px-5 py-8 text-sm text-slate-500">
                No hay reglas cargadas.
              </div>
            ) : (
              rules.map((rule) => (
                <article
                  key={rule.id}
                  className="flex flex-col gap-4 rounded-[1.6rem] border border-rose-100/80 bg-white px-5 py-4 shadow-[0_18px_55px_-46px_rgba(148,70,88,0.45)] transition hover:bg-rose-50/45 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-brand-ink">{days[rule.dayOfWeek]}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-wine">
                        {rule.type === "BREAK" ? <Coffee className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                        {ruleLabels[rule.type]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {rule.startTime} - {rule.endTime}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-10 px-4 text-xs"
                      onClick={() => onEditRule(rule)}
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      Editar
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
                </article>
              ))
            )}
          </div>

          <div className="min-w-0 rounded-[1.85rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_28px_80px_-54px_rgba(148,70,88,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine">
                  {editingRule ? "Editar bloque" : "Nuevo bloque horario"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                  {editingRule ? `${days[editingRule.dayOfWeek]} ${editingRule.startTime}` : "Carga una regla semanal"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  El recepcionista deberia poder entender rapido que dias estan abiertos y donde
                  hay pausas operativas.
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
                  {days.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
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
      </div>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-rose-50/60 to-white px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine shadow-sm">
              <Ban className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">Excepciones</p>
              <h2 className="mt-1 text-2xl font-semibold text-brand-ink">Fechas bloqueadas</h2>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Corta dias completos o franjas puntuales por feriados, capacitaciones o cierres.
          </p>
        </div>

        <div className="grid gap-6 p-6">
          <form
            onSubmit={handleSubmitBlockedDate(submitBlockedDate)}
            className="rounded-[1.85rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_28px_80px_-54px_rgba(148,70,88,0.55)]"
          >
            <div className="grid gap-4">
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

              <p className="text-xs text-slate-500">
                {hasPartialBlock
                  ? "Si cargas horario, se bloqueara solo esa franja."
                  : "Si dejas las horas vacias, se bloquea el dia completo."}
              </p>

              <Button type="submit" className="w-full" disabled={isSavingBlockedDate}>
                {isSavingBlockedDate ? "Guardando..." : "Bloquear fecha"}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {blockedDates.length === 0 ? (
              <div className="rounded-[1.5rem] border border-rose-100 px-5 py-8 text-sm text-slate-500">
                No hay bloqueos cargados.
              </div>
            ) : (
              blockedDates.map((blockedDate) => {
                const normalizedDate = String(blockedDate.date).slice(0, 10);
                const dateLabel = dayjs(normalizedDate).format("DD/MM/YYYY");
                const rangeLabel =
                  blockedDate.startTime && blockedDate.endTime
                    ? `${blockedDate.startTime} - ${blockedDate.endTime}`
                    : "Dia completo";

                return (
                  <article
                    key={blockedDate.id}
                    className="flex flex-col gap-4 rounded-[1.6rem] border border-rose-100/80 bg-white px-5 py-4 shadow-[0_18px_55px_-46px_rgba(148,70,88,0.45)] transition hover:bg-rose-50/45 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-brand-ink">{dateLabel}</p>
                      <p className="mt-1 text-sm text-slate-600">{rangeLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">{blockedDate.reason || "Sin motivo especificado"}</p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-10 px-4 text-xs"
                      disabled={isDeletingBlockedDateId === blockedDate.id}
                      onClick={() => onDeleteBlockedDate(blockedDate.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeletingBlockedDateId === blockedDate.id ? "Eliminando..." : "Quitar bloqueo"}
                    </Button>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
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
    <div className="rounded-[1.25rem] border border-rose-100/80 bg-rose-50/55 px-4 py-3">
      <div className="flex items-center gap-2 text-brand-wine">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
