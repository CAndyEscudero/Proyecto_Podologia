import { z } from "zod";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Clock3, Globe2, Mail, MapPin, Phone, Settings2 } from "lucide-react";
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
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <div className="card-surface overflow-hidden">
        <div className="border-b border-slate-200/80 bg-white px-5 py-5 md:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-brand-wine">
              <Settings2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Configuracion</p>
              <h2 className="mt-1 text-2xl font-semibold text-brand-ink">Datos del negocio</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Ajusta identidad, contacto y reglas operativas sin tocar la logica del sistema.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 p-5 md:p-6">
          <FormSection
            title="Marca y contacto"
            copy="Informacion que aparece en el sitio y sirve como referencia para pacientes y recepcion."
          >
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
            </div>
          </FormSection>

          <FormSection
            title="Reglas operativas"
            copy="Afectan la disponibilidad publicada y el margen operativo entre turnos."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ventana de reserva" error={errors.bookingWindowDays?.message} hint="Dias de anticipacion disponibles en el booking.">
                <input type="number" min="1" max="365" {...register("bookingWindowDays")} className="field-input" />
              </Field>
              <Field label="Separacion entre turnos" error={errors.appointmentGapMin?.message} hint="Tiempo extra entre atenciones para aire operativo.">
                <input type="number" min="0" max="120" {...register("appointmentGapMin")} className="field-input" />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="Regionalizacion"
            copy="Define la zona horaria usada para agenda, disponibilidad y visualizacion de turnos."
          >
            <Field label="Timezone" error={errors.timezone?.message}>
              <input type="text" {...register("timezone")} className="field-input" />
            </Field>
          </FormSection>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/75 px-4 py-4">
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-brand-ink">Aplicacion inmediata</p>
              <p className="mt-1 max-w-2xl">
                Los cambios impactan en el sitio publico y en la disponibilidad operativa del negocio.
              </p>
            </div>
            <Button type="submit" className="min-w-52" disabled={isSaving || !isDirty}>
              {isSaving ? "Guardando..." : "Guardar configuracion"}
            </Button>
          </div>
        </form>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <PreviewCard
          title="Preview institucional"
          copy="Asi se veran los datos principales del negocio."
          icon={<Building2 className="h-5 w-5" />}
        >
          <h3 className="mt-1 text-2xl font-semibold text-brand-ink">{preview.businessName || "Tu negocio"}</h3>
          <div className="mt-4 space-y-3">
            <PreviewRow label="Telefono" value={preview.phone || "Sin telefono cargado"} icon={<Phone className="h-4 w-4" />} />
            <PreviewRow label="Email" value={preview.contactEmail || "Sin email cargado"} icon={<Mail className="h-4 w-4" />} />
            <PreviewRow label="Direccion" value={preview.address || "Sin direccion cargada"} icon={<MapPin className="h-4 w-4" />} />
            <PreviewRow label="Timezone" value={preview.timezone} icon={<Globe2 className="h-4 w-4" />} />
          </div>
        </PreviewCard>

        <PreviewCard
          title="Resumen operativo"
          copy="Metricas breves para validar reglas sin tener que releer todo el formulario."
          icon={<Clock3 className="h-5 w-5" />}
        >
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricTile label="Ventana activa" value={`${preview.bookingWindowDays || 45} dias`} />
            <MetricTile label="Gap entre turnos" value={`${preview.appointmentGapMin || 0} min`} />
          </div>
        </PreviewCard>
      </aside>
    </section>
  );
}

interface FormSectionProps {
  title: string;
  copy: string;
  children: ReactNode;
}

function FormSection({ title, copy, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
      <div className="border-b border-slate-100 pb-3">
        <p className="text-sm font-semibold text-brand-ink">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{copy}</p>
      </div>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-2 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

interface PreviewCardProps {
  title: string;
  copy: string;
  icon: ReactNode;
  children: ReactNode;
}

function PreviewCard({ title, copy, icon, children }: PreviewCardProps) {
  return (
    <div className="card-surface overflow-hidden px-5 py-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-brand-wine">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-brand-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface PreviewRowProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function PreviewRow({ label, value, icon }: PreviewRowProps) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">{value}</p>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string;
}

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
