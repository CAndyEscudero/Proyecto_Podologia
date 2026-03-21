import { z } from "zod";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Clock3, Globe2, MapPin, Mail, Phone, Settings2 } from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import type {
  BusinessSettings,
  BusinessSettingsFormValues,
  UpdateBusinessSettingsPayload,
} from "../types/business-settings.types";

const settingsSchema = z.object({
  businessName: z.string().trim().min(3, "Ingresa un nombre valido").max(120, "Maximo 120 caracteres"),
  contactEmail: z.union([z.literal(""), z.string().trim().max(120, "Maximo 120 caracteres").email("Email invalido")]),
  phone: z.union([z.literal(""), z.string().trim().min(8, "Telefono invalido").max(20, "Telefono invalido")]),
  address: z.union([z.literal(""), z.string().trim().min(5, "Direccion invalida").max(180, "Maximo 180 caracteres")]),
  appointmentGapMin: z.coerce.number().int().min(0, "Minimo 0").max(120, "Maximo 120"),
  bookingWindowDays: z.coerce.number().int().min(1, "Minimo 1").max(365, "Maximo 365"),
  timezone: z.string().trim().min(3, "Timezone invalida").max(80, "Maximo 80 caracteres"),
});

const defaultValues: BusinessSettingsFormValues = {
  businessName: "",
  contactEmail: "",
  phone: "",
  address: "",
  appointmentGapMin: 0,
  bookingWindowDays: 45,
  timezone: "America/Argentina/Buenos_Aires",
};

interface BusinessSettingsPanelProps {
  settings: BusinessSettings | null;
  onSave: (payload: UpdateBusinessSettingsPayload) => void;
  isSaving: boolean;
}

export function BusinessSettingsPanel({ settings, onSave, isSaving }: BusinessSettingsPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!settings) {
      return;
    }

    reset({
      businessName: settings.businessName || "",
      contactEmail: settings.contactEmail || "",
      phone: settings.phone || "",
      address: settings.address || "",
      appointmentGapMin: settings.appointmentGapMin ?? 0,
      bookingWindowDays: settings.bookingWindowDays ?? 45,
      timezone: settings.timezone || "America/Argentina/Buenos_Aires",
    });
  }, [settings, reset]);

  const preview = {
    businessName: watch("businessName"),
    phone: watch("phone"),
    contactEmail: watch("contactEmail"),
    address: watch("address"),
    bookingWindowDays: watch("bookingWindowDays"),
    appointmentGapMin: watch("appointmentGapMin"),
    timezone: watch("timezone"),
  };

  function onSubmit(values: BusinessSettingsFormValues): void {
    onSave({
      businessName: values.businessName,
      contactEmail: values.contactEmail || null,
      phone: values.phone || null,
      address: values.address || null,
      appointmentGapMin: values.appointmentGapMin,
      bookingWindowDays: values.bookingWindowDays,
      timezone: values.timezone,
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <div className="card-surface overflow-hidden">
        <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-rose-50/60 to-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine shadow-sm">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                    Identidad y operativa
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-brand-ink">Configuracion del negocio</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Ajusta los datos visibles de la clinica y las reglas operativas que impactan en las
                reservas para mantener una experiencia consistente y profesional.
              </p>
            </div>

            <div className="grid min-w-[240px] gap-3 rounded-[1.5rem] border border-rose-100 bg-white/85 p-4 shadow-[0_18px_45px_-36px_rgba(148,70,88,0.5)] sm:grid-cols-2">
              <MetricPill label="Ventana" value={`${preview.bookingWindowDays || 45} dias`} icon={<Clock3 className="h-4 w-4" />} />
              <MetricPill label="Gap" value={`${preview.appointmentGapMin || 0} min`} icon={<Clock3 className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre comercial" error={errors.businessName?.message}>
              <input type="text" {...register("businessName")} className="field-input" />
            </Field>
            <Field label="Email de contacto" error={errors.contactEmail?.message}>
              <input type="email" {...register("contactEmail")} className="field-input" />
            </Field>
            <Field label="Telefono" error={errors.phone?.message}>
              <input type="text" {...register("phone")} className="field-input" />
            </Field>
            <Field label="Direccion" error={errors.address?.message}>
              <input type="text" {...register("address")} className="field-input" />
            </Field>
            <Field label="Ventana de reserva" error={errors.bookingWindowDays?.message}>
              <input type="number" min="1" max="365" {...register("bookingWindowDays")} className="field-input" />
            </Field>
            <Field label="Separacion entre turnos" error={errors.appointmentGapMin?.message}>
              <input type="number" min="0" max="120" {...register("appointmentGapMin")} className="field-input" />
            </Field>
          </div>

          <Field label="Timezone" error={errors.timezone?.message}>
            <input type="text" {...register("timezone")} className="field-input" />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] px-4 py-4 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-brand-ink">Impacto inmediato</p>
              <p className="mt-1">
                Estos cambios afectan lo que ve el paciente y como se calcula la disponibilidad.
              </p>
            </div>
            <Button type="submit" className="min-w-52" disabled={isSaving || !isDirty}>
              {isSaving ? "Guardando..." : "Guardar configuracion"}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="card-surface overflow-hidden px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-wine">Preview institucional</p>
              <p className="mt-1 text-sm text-slate-600">Asi se veran los datos base del negocio.</p>
            </div>
          </div>
          <h3 className="mt-3 font-display text-3xl text-brand-ink">{preview.businessName || "Tu negocio"}</h3>
          <div className="mt-5 grid gap-4 text-sm text-slate-600">
            <PreviewItem label="Telefono" value={preview.phone || "Sin telefono cargado"} icon={<Phone className="h-4 w-4" />} />
            <PreviewItem label="Email" value={preview.contactEmail || "Sin email cargado"} icon={<Mail className="h-4 w-4" />} />
            <PreviewItem label="Direccion" value={preview.address || "Sin direccion cargada"} icon={<MapPin className="h-4 w-4" />} />
            <PreviewItem label="Timezone" value={preview.timezone} icon={<Globe2 className="h-4 w-4" />} />
          </div>
        </div>

        <div className="card-surface overflow-hidden px-6 py-5">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-wine">Reglas activas</p>
          <div className="mt-4 grid gap-3">
            <RuleCard
              label="Ventana de reserva"
              value={`${preview.bookingWindowDays || 45} dias`}
              copy="Define hasta cuanta anticipacion puede reservar un paciente desde la web."
            />
            <RuleCard
              label="Separacion entre turnos"
              value={`${preview.appointmentGapMin || 0} min`}
              copy="Se suma a la duracion del servicio para dejar aire operativo entre pacientes."
            />
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

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
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

interface PreviewItemProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function PreviewItem({ label, value, icon }: PreviewItemProps) {
  return (
    <div className="rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-brand-wine">
        {icon}
        <p className="text-xs font-bold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">{value}</p>
    </div>
  );
}

interface RuleCardProps {
  label: string;
  value: string;
  copy: string;
}

function RuleCard({ label, value, copy }: RuleCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50/40 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-brand-ink">{label}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-wine">{value}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{copy}</p>
    </div>
  );
}
