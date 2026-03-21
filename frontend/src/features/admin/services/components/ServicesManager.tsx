import { z } from "zod";
import clsx from "clsx";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgePlus, Clock3, PencilLine, Stethoscope, Trash2, WalletCards } from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import type {
  CreateServicePayload,
  Service,
  ServiceFormValues,
  UpdateServicePayload,
} from "../types/services.types";

const serviceSchema = z.object({
  name: z.string().trim().min(3, "Ingresa un nombre valido").max(80, "Maximo 80 caracteres"),
  slug: z
    .string()
    .trim()
    .min(3, "Ingresa un slug valido")
    .max(80, "Maximo 80 caracteres")
    .regex(/^[a-z0-9-]+$/, "Usa solo minusculas, numeros y guiones"),
  description: z.string().trim().min(10, "Suma una descripcion breve").max(800, "Maximo 800 caracteres"),
  durationMin: z.coerce.number().int().min(15, "Minimo 15 minutos"),
  priceCents: z
    .union([z.literal(""), z.coerce.number().int().min(0, "No puede ser negativo")])
    .refine((value) => value === "" || value <= 100000000, "Precio demasiado alto")
    .transform((value) => (value === "" ? null : value)),
});

const emptyValues: ServiceFormValues = {
  name: "",
  slug: "",
  description: "",
  durationMin: 45,
  priceCents: "",
};

interface ServicesManagerProps {
  services: Service[];
  onCreate: (payload: CreateServicePayload, onSuccess?: () => void) => void;
  onUpdate: (id: number, payload: UpdateServicePayload, onSuccess?: () => void) => void;
  onDelete: (id: number) => void;
  isSaving: boolean;
  isDeletingId: number | null;
  editingService: Service | null;
  onEdit: (service: Service) => void;
  onCancelEdit: () => void;
}

export function ServicesManager({
  services,
  onCreate,
  onUpdate,
  onDelete,
  isSaving,
  isDeletingId,
  editingService,
  onEdit,
  onCancelEdit,
}: ServicesManagerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (editingService) {
      reset({
        name: editingService.name,
        slug: editingService.slug,
        description: editingService.description,
        durationMin: editingService.durationMin,
        priceCents: editingService.priceCents ?? "",
      });
      return;
    }

    reset(emptyValues);
  }, [editingService, reset]);

  function onSubmit(values: ServiceFormValues): void {
    const payload: CreateServicePayload = {
      ...values,
      priceCents:
        values.priceCents === "" || values.priceCents === null ? undefined : values.priceCents,
    };

    if (editingService) {
      onUpdate(editingService.id, payload, () => reset(emptyValues));
      return;
    }

    onCreate(payload, () => reset(emptyValues));
  }

  return (
    <section className="card-surface overflow-hidden">
      <div className="border-b border-rose-100/80 bg-gradient-to-r from-white via-rose-50/60 to-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-brand-wine shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                  Catalogo de prestaciones
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-brand-ink">Servicios</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Administra la oferta real que el paciente puede reservar desde el sitio y manten la
              agenda alineada con el trabajo diario del consultorio.
            </p>
          </div>

          <div className="grid min-w-[220px] gap-3 rounded-[1.5rem] border border-rose-100 bg-white/80 p-4 shadow-[0_18px_45px_-36px_rgba(148,70,88,0.5)] sm:grid-cols-2">
            <MetricPill label="Activos" value={String(services.length)} icon={<BadgePlus className="h-4 w-4" />} />
            <MetricPill
              label="Ticket visible"
              value={services.some((service) => service.priceCents) ? "Si" : "No"}
              icon={<WalletCards className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="overflow-hidden rounded-[1.75rem] border border-rose-100/80 bg-white shadow-[0_28px_80px_-54px_rgba(148,70,88,0.55)]">
          <div className="flex items-center justify-between gap-3 border-b border-rose-100/80 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-wine/80">
                Vista operativa
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Prestaciones visibles para reserva y gestion interna.
              </p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-brand-wine">
              {services.length} registros
            </span>
          </div>
          {services.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">Todavia no hay servicios activos.</div>
          ) : (
            <div className="divide-y divide-rose-100/80">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-rose-50/45 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-brand-ink">{service.name}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-wine">
                        <Clock3 className="h-3.5 w-3.5" />
                        {service.durationMin} min
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">{service.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <ServiceMeta label="Slug" value={service.slug} />
                      <ServiceMeta
                        label="Precio"
                        value={
                          service.priceCents
                            ? new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                maximumFractionDigits: 0,
                              }).format(service.priceCents)
                            : "A consultar"
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant={editingService?.id === service.id ? "primary" : "secondary"}
                      className="min-h-10 px-4 text-xs"
                      onClick={() => onEdit(service)}
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      {editingService?.id === service.id ? "Editando" : "Editar"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className={clsx(
                        "min-h-10 px-4 text-xs",
                        isDeletingId === service.id && "pointer-events-none opacity-60"
                      )}
                      onClick={() => onDelete(service.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeletingId === service.id ? "Desactivando..." : "Desactivar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.85rem] border border-rose-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,241,243,0.92))] p-5 shadow-[0_28px_80px_-54px_rgba(148,70,88,0.55)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine/85">
                {editingService ? "Editar servicio" : "Nuevo servicio"}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                {editingService ? editingService.name : "Carga una nueva prestacion"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mantene el catalogo prolijo para que el equipo encuentre rapido que ofrecer y el
                paciente vea informacion clara al reservar.
              </p>
            </div>
            {editingService ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-sm font-semibold text-slate-500 transition hover:text-brand-wine"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Nombre</span>
              <input type="text" {...register("name")} className="field-input" placeholder="Podologia clinica" />
              {errors.name ? <span className="mt-2 block text-xs text-red-500">{errors.name.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Slug</span>
              <input type="text" {...register("slug")} className="field-input" placeholder="podologia-clinica" />
              {errors.slug ? <span className="mt-2 block text-xs text-red-500">{errors.slug.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">Descripcion</span>
              <textarea
                {...register("description")}
                className="field-input min-h-28 resize-none py-3"
                placeholder="Describe brevemente el tratamiento, enfoque o beneficio principal."
              />
              {errors.description ? (
                <span className="mt-2 block text-xs text-red-500">{errors.description.message}</span>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-ink">Duracion</span>
                <input type="number" min="15" step="15" {...register("durationMin")} className="field-input" />
                {errors.durationMin ? (
                  <span className="mt-2 block text-xs text-red-500">{errors.durationMin.message}</span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-ink">Precio opcional</span>
                <input type="number" min="0" step="100" {...register("priceCents")} className="field-input" />
                {errors.priceCents ? (
                  <span className="mt-2 block text-xs text-red-500">{errors.priceCents.message}</span>
                ) : (
                  <span className="mt-2 block text-xs text-slate-500">Cargalo en pesos argentinos. Ejemplo: 25000 = ARS 25.000.</span>
                )}
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Guardando..." : editingService ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </form>
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

interface ServiceMetaProps {
  label: string;
  value: string;
}

function ServiceMeta({ label, value }: ServiceMetaProps) {
  return (
    <span className="rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs text-slate-600">
      <strong className="font-semibold text-brand-ink">{label}:</strong> {value}
    </span>
  );
}
