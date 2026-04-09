import { z } from "zod";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgePercent,
  Building2,
  Clock3,
  CreditCard,
  Globe2,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import { TenantDomainsPanel } from "../../tenant-domains/components/TenantDomainsPanel";
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
  depositPercentage: z.coerce.number().int().min(1, "Minimo 1").max(100, "Maximo 100"),
  mercadoPagoEnabled: z.boolean(),
  transactionalEmailEnabled: z.boolean(),
  transactionalEmailFromName: z.union([z.literal(""), z.string().trim().max(120, "Maximo 120 caracteres")]),
  transactionalEmailReplyTo: z.union([z.literal(""), z.string().trim().max(120, "Maximo 120 caracteres").email("Email invalido")]),
  whatsAppEnabled: z.boolean(),
  whatsAppNumber: z.union([z.literal(""), z.string().trim().max(30, "Maximo 30 caracteres")]),
  whatsAppDefaultMessage: z.union([z.literal(""), z.string().trim().max(500, "Maximo 500 caracteres")]),
  timezone: z.string().trim().min(3, "Timezone invalida").max(80, "Maximo 80 caracteres"),
});

const defaultValues: BusinessSettingsFormValues = {
  businessName: "",
  contactEmail: "",
  phone: "",
  address: "",
  appointmentGapMin: 0,
  bookingWindowDays: 45,
  depositPercentage: 50,
  mercadoPagoEnabled: false,
  transactionalEmailEnabled: false,
  transactionalEmailFromName: "",
  transactionalEmailReplyTo: "",
  whatsAppEnabled: false,
  whatsAppNumber: "",
  whatsAppDefaultMessage: "",
  timezone: "America/Argentina/Buenos_Aires",
};

interface BusinessSettingsPanelProps {
  settings: BusinessSettings | null;
  onSave: (payload: UpdateBusinessSettingsPayload) => void;
  onConnectMercadoPago: () => void;
  onDisconnectMercadoPago: () => void;
  isSaving: boolean;
  isConnectingMercadoPago: boolean;
  isDisconnectingMercadoPago: boolean;
}

export function BusinessSettingsPanel({
  settings,
  onSave,
  onConnectMercadoPago,
  onDisconnectMercadoPago,
  isSaving,
  isConnectingMercadoPago,
  isDisconnectingMercadoPago,
}: BusinessSettingsPanelProps) {
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
      depositPercentage: settings.depositPercentage ?? 50,
      mercadoPagoEnabled: settings.mercadoPagoEnabled ?? false,
      transactionalEmailEnabled: settings.transactionalEmailEnabled ?? false,
      transactionalEmailFromName: settings.transactionalEmailFromName || "",
      transactionalEmailReplyTo: settings.transactionalEmailReplyTo || "",
      whatsAppEnabled: settings.whatsAppEnabled ?? false,
      whatsAppNumber: settings.whatsAppNumber || "",
      whatsAppDefaultMessage: settings.whatsAppDefaultMessage || "",
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
    depositPercentage: watch("depositPercentage"),
    mercadoPagoEnabled: watch("mercadoPagoEnabled"),
    transactionalEmailEnabled: watch("transactionalEmailEnabled"),
    transactionalEmailFromName: watch("transactionalEmailFromName"),
    transactionalEmailReplyTo: watch("transactionalEmailReplyTo"),
    whatsAppEnabled: watch("whatsAppEnabled"),
    whatsAppNumber: watch("whatsAppNumber"),
    whatsAppDefaultMessage: watch("whatsAppDefaultMessage"),
    timezone: watch("timezone"),
  };

  function onSubmit(values: BusinessSettingsFormValues): void {
    const payload: UpdateBusinessSettingsPayload = {
      businessName: values.businessName,
      contactEmail: values.contactEmail || null,
      phone: values.phone || null,
      address: values.address || null,
      appointmentGapMin: values.appointmentGapMin,
      bookingWindowDays: values.bookingWindowDays,
      depositPercentage: values.depositPercentage,
      mercadoPagoEnabled: values.mercadoPagoEnabled,
      transactionalEmailEnabled: values.transactionalEmailEnabled,
      transactionalEmailFromName: values.transactionalEmailFromName || null,
      transactionalEmailReplyTo: values.transactionalEmailReplyTo || null,
      whatsAppEnabled: values.whatsAppEnabled,
      whatsAppNumber: values.whatsAppNumber || null,
      whatsAppDefaultMessage: values.whatsAppDefaultMessage || null,
      timezone: values.timezone,
    };

    onSave(payload);
  }

  const mercadoPagoConnection = settings?.mercadoPagoConnection || null;
  const usingMercadoPagoOauth = settings?.mercadoPagoSetupMode === "OAUTH";
  const mercadoPagoReady =
    Boolean(preview.mercadoPagoEnabled) &&
    Boolean(mercadoPagoConnection?.isConnected) &&
    Boolean(settings?.hasMercadoPagoWebhookSecret);
  const transactionalEmailReady =
    Boolean(preview.transactionalEmailEnabled) &&
    Boolean(preview.transactionalEmailFromName || preview.businessName) &&
    Boolean(preview.transactionalEmailReplyTo || preview.contactEmail);
  const whatsAppReady =
    Boolean(preview.whatsAppEnabled) &&
    Boolean(preview.whatsAppNumber);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <div className="space-y-6">
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
                      Identidad, agenda, cobros y canales
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-brand-ink">Configuracion del negocio</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Ajusta lo que ve el paciente, la logica de reservas y las integraciones del tenant
                  sin exponer secretos en el panel.
                </p>
              </div>

              <div className="grid min-w-[260px] gap-3 rounded-[1.5rem] border border-rose-100 bg-white/85 p-4 shadow-[0_18px_45px_-36px_rgba(148,70,88,0.5)] sm:grid-cols-5">
                <MetricPill label="Ventana" value={`${preview.bookingWindowDays || 45} dias`} icon={<Clock3 className="h-4 w-4" />} />
                <MetricPill label="Gap" value={`${preview.appointmentGapMin || 0} min`} icon={<Clock3 className="h-4 w-4" />} />
                <MetricPill label="Sena" value={`${preview.depositPercentage || 50}%`} icon={<BadgePercent className="h-4 w-4" />} />
                <MetricPill label="Emails" value={preview.transactionalEmailEnabled ? "On" : "Off"} icon={<Send className="h-4 w-4" />} />
                <MetricPill label="WhatsApp" value={preview.whatsAppEnabled ? "On" : "Off"} icon={<MessageCircle className="h-4 w-4" />} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 p-6">
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
              <Field label="Porcentaje de sena" error={errors.depositPercentage?.message}>
                <input type="number" min="1" max="100" {...register("depositPercentage")} className="field-input" />
              </Field>
              <Field label="Timezone" error={errors.timezone?.message}>
                <input type="text" {...register("timezone")} className="field-input" />
              </Field>
            </div>

          <section className="rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 text-brand-wine">
                  <CreditCard className="h-5 w-5" />
                  <p className="text-sm font-bold uppercase tracking-[0.18em]">Mercado Pago por tenant</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cada negocio conecta su propia cuenta con un boton simple. El cliente no ve keys,
                  no copia tokens y vuelve al panel con la cuenta ya vinculada.
                </p>
              </div>

              <label className="inline-flex items-center gap-3 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink">
                <input type="checkbox" {...register("mercadoPagoEnabled")} className="h-4 w-4 rounded border-rose-300 text-brand-wine focus:ring-brand-wine" />
                Cobros online habilitados
              </label>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.4rem] border border-rose-100 bg-white/90 p-4 shadow-[0_16px_40px_-32px_rgba(148,70,88,0.35)]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-wine">Conexion simple</p>
                <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <li>
                    <span className="font-semibold text-brand-ink">1.</span> Toca{" "}
                    <span className="font-semibold text-brand-ink">Conectar con Mercado Pago</span>.
                  </li>
                  <li>
                    <span className="font-semibold text-brand-ink">2.</span> Inicia sesion en Mercado Pago y acepta la vinculacion.
                  </li>
                  <li>
                    <span className="font-semibold text-brand-ink">3.</span> Vuelves a tu panel y la cuenta queda lista para cobrar desde la app.
                  </li>
                </ol>

                <div className="mt-5 flex flex-wrap gap-3">
                  {mercadoPagoConnection?.isConnected ? (
                    <>
                      <Button
                        type="button"
                        onClick={onConnectMercadoPago}
                        disabled={isConnectingMercadoPago || isDisconnectingMercadoPago}
                      >
                        {isConnectingMercadoPago ? "Reconectando..." : "Reconectar cuenta"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onDisconnectMercadoPago}
                        disabled={isConnectingMercadoPago || isDisconnectingMercadoPago}
                      >
                        {isDisconnectingMercadoPago ? "Desconectando..." : "Desconectar"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={onConnectMercadoPago}
                      disabled={isConnectingMercadoPago || isDisconnectingMercadoPago}
                    >
                      {isConnectingMercadoPago ? "Conectando..." : "Conectar con Mercado Pago"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-rose-100 bg-white/90 p-4 shadow-[0_16px_40px_-32px_rgba(148,70,88,0.35)]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-wine">Estado de la cuenta</p>
                <div className="mt-4 grid gap-3">
                  <StatusLine
                    label="Modo de integracion"
                    value={usingMercadoPagoOauth ? "OAuth de plataforma" : "Sin conectar"}
                  />
                  <StatusLine
                    label="Cuenta"
                    value={mercadoPagoConnection?.accountLabel || "Aun no hay una cuenta vinculada"}
                  />
                  <StatusLine
                    label="Public key"
                    value={mercadoPagoConnection?.publicKey ? "Sincronizada" : "Pendiente"}
                  />
                  <StatusLine
                    label="Webhooks"
                    value={settings?.hasMercadoPagoWebhookSecret ? "Firma lista" : "Pendiente"}
                  />
                  <StatusLine
                    label="Conectada desde"
                    value={formatOptionalDate(mercadoPagoConnection?.connectedAt)}
                  />
                  <StatusLine
                    label="Ultimo webhook"
                    value={formatOptionalDate(mercadoPagoConnection?.lastWebhookAt)}
                  />
                  {mercadoPagoConnection?.lastError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">Ultimo problema detectado</p>
                      <p className="mt-1 leading-6">{mercadoPagoConnection.lastError}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 text-brand-wine">
                  <Send className="h-5 w-5" />
                  <p className="text-sm font-bold uppercase tracking-[0.18em]">Email transaccional</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  La plataforma envia emails desde una cuenta central y cada tenant define su nombre
                  visible y el email de respuesta.
                </p>
              </div>

              <label className="inline-flex items-center gap-3 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink">
                <input type="checkbox" {...register("transactionalEmailEnabled")} className="h-4 w-4 rounded border-rose-300 text-brand-wine focus:ring-brand-wine" />
                Emails automaticos habilitados
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nombre del remitente" error={errors.transactionalEmailFromName?.message}>
                <input type="text" {...register("transactionalEmailFromName")} className="field-input" placeholder="Turnos Pies Sanos" />
              </Field>
              <Field
                label="Reply-to"
                hint="Si el paciente responde el mail, le llega a esta direccion."
                error={errors.transactionalEmailReplyTo?.message}
              >
                <input type="email" {...register("transactionalEmailReplyTo")} className="field-input" placeholder="recepcion@tunegocio.com" />
              </Field>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 text-brand-wine">
                  <MessageCircle className="h-5 w-5" />
                  <p className="text-sm font-bold uppercase tracking-[0.18em]">WhatsApp del tenant</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Dejamos listo el canal por negocio para links `wa.me` y futuras integraciones mas
                  profundas sin mezclar numeros entre tenants.
                </p>
              </div>

              <label className="inline-flex items-center gap-3 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink">
                <input type="checkbox" {...register("whatsAppEnabled")} className="h-4 w-4 rounded border-rose-300 text-brand-wine focus:ring-brand-wine" />
                WhatsApp habilitado
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                label="Numero de WhatsApp"
                hint="Podes pegarlo con espacios o simbolos. Se normaliza automaticamente."
                error={errors.whatsAppNumber?.message}
              >
                <input type="text" {...register("whatsAppNumber")} className="field-input" placeholder="5493462000000" />
              </Field>
              <Field
                label="Mensaje base"
                hint="Se usa como texto inicial para links genericos del sitio."
                error={errors.whatsAppDefaultMessage?.message}
              >
                <textarea {...register("whatsAppDefaultMessage")} rows={4} className="field-input min-h-28 resize-y" placeholder="Hola, quiero consultar por un turno." />
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] px-4 py-4 shadow-[0_24px_60px_-48px_rgba(148,70,88,0.45)]">
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-brand-ink">Impacto inmediato</p>
              <p className="mt-1">
                Estos cambios afectan reservas online, calculo de sena, callbacks de pago y canales automaticos del tenant.
              </p>
            </div>
            <Button type="submit" className="min-w-52" disabled={isSaving || !isDirty}>
              {isSaving ? "Guardando..." : "Guardar configuracion"}
            </Button>
          </div>
          </form>
        </div>

        <TenantDomainsPanel />
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
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-wine">Cobros online</p>
              <p className="mt-1 text-sm text-slate-600">Resumen del estado actual de la integracion.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <RuleCard
              label="Estado general"
              value={mercadoPagoReady ? "Listo" : preview.mercadoPagoEnabled ? "Incompleto" : "Deshabilitado"}
              copy={
                mercadoPagoReady
                  ? "El tenant ya tiene una cuenta conectada por OAuth y puede cobrar desde la app."
                  : preview.mercadoPagoEnabled
                    ? "Activalo solo cuando la cuenta este conectada y la firma del webhook este lista."
                    : "No se ofreceran reservas pagas hasta habilitar esta opcion."
              }
            />
            <RuleCard
              label="Cuenta vinculada"
              value={mercadoPagoConnection?.isConnected ? "Conectada" : "Pendiente"}
              copy={
                mercadoPagoConnection?.accountLabel
                  ? mercadoPagoConnection.accountLabel
                  : "Todavia no hay una cuenta de Mercado Pago vinculada a este tenant."
              }
            />
            <RuleCard
              label="Conexion segura"
              value={settings?.hasMercadoPagoWebhookSecret ? "Lista" : "Pendiente"}
              copy={
                usingMercadoPagoOauth
                  ? "La firma del webhook vive en la configuracion global de la plataforma; el cliente no toca secretos."
                  : "Aun falta completar la vinculacion OAuth de la cuenta del negocio."
              }
            />
          </div>
        </div>

        <div className="card-surface overflow-hidden px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-wine">Email transaccional</p>
              <p className="mt-1 text-sm text-slate-600">Estado del canal de notificaciones por email.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <RuleCard
              label="Estado general"
              value={transactionalEmailReady ? "Listo" : preview.transactionalEmailEnabled ? "Incompleto" : "Deshabilitado"}
              copy={
                transactionalEmailReady
                  ? "El tenant puede enviar emails automaticos con branding propio desde la cuenta central."
                  : preview.transactionalEmailEnabled
                    ? "Completa remitente y reply-to para dejar el canal prolijo antes de activarlo en produccion."
                    : "No se enviaran confirmaciones o avisos por email mientras este canal siga apagado."
              }
            />
            <RuleCard
              label="Remitente visible"
              value={preview.transactionalEmailFromName || preview.businessName || "Pendiente"}
              copy="Es el nombre que ve el paciente en la bandeja de entrada."
            />
            <RuleCard
              label="Reply-to"
              value={preview.transactionalEmailReplyTo || preview.contactEmail || "Pendiente"}
              copy="Las respuestas del paciente pueden ir al email operativo del negocio."
            />
          </div>
        </div>

        <div className="card-surface overflow-hidden px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-wine">WhatsApp</p>
              <p className="mt-1 text-sm text-slate-600">Estado del canal humano por tenant.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <RuleCard
              label="Estado general"
              value={whatsAppReady ? "Listo" : preview.whatsAppEnabled ? "Incompleto" : "Deshabilitado"}
              copy={
                whatsAppReady
                  ? "El tenant ya tiene su propio numero listo para links y automatizaciones futuras."
                  : preview.whatsAppEnabled
                    ? "Carga un numero valido para habilitar enlaces consistentes por negocio."
                    : "El sitio no deberia ofrecer atajos a WhatsApp mientras este canal siga apagado."
              }
            />
            <RuleCard
              label="Numero"
              value={preview.whatsAppNumber || "Pendiente"}
              copy="Se guarda por tenant y se normaliza para construir enlaces `wa.me`."
            />
            <RuleCard
              label="Mensaje base"
              value={preview.whatsAppDefaultMessage ? "Configurado" : "Pendiente"}
              copy="Sirve como fallback para botones genericos de consulta."
            />
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
            <RuleCard
              label="Sena online"
              value={`${preview.depositPercentage || 50}%`}
              copy="Se usa para calcular el monto a cobrar cuando el turno se confirma con pago online."
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
  hint?: string;
  children: ReactNode;
}

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="mt-2 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

interface PreviewItemProps {
  label: string;
  value: string;
  icon: ReactNode;
}

interface StatusLineProps {
  label: string;
  value: string;
}

function StatusLine({ label, value }: StatusLineProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-100/80 bg-rose-50/40 px-4 py-3">
      <p className="text-sm font-semibold text-brand-ink">{label}</p>
      <p className="max-w-[60%] text-right text-sm text-slate-600">{value}</p>
    </div>
  );
}

function formatOptionalDate(value?: string | null): string {
  if (!value) {
    return "Aun sin datos";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Aun sin datos";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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
