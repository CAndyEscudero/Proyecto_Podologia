import { z } from "zod";
import clsx from "clsx";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/Button";

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

const emptyValues = {
  name: "",
  slug: "",
  description: "",
  durationMin: 45,
  priceCents: "",
};

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
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
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

  function onSubmit(values) {
    const payload = {
      ...values,
      priceCents: values.priceCents === null ? undefined : values.priceCents,
    };

    if (editingService) {
      onUpdate(editingService.id, payload, () => reset(emptyValues));
      return;
    }

    onCreate(payload, () => reset(emptyValues));
  }

  return (
    <section className="card-surface overflow-hidden">
      <div className="border-b border-rose-100 px-6 py-5">
        <h2 className="text-2xl font-semibold text-brand-ink">Servicios</h2>
        <p className="mt-2 text-sm text-slate-600">
          Administra la oferta real que el paciente puede reservar desde el sitio.
        </p>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="overflow-hidden rounded-[1.5rem] border border-rose-100">
          {services.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">Todavia no hay servicios activos.</div>
          ) : (
            <div className="divide-y divide-rose-100">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-brand-ink">{service.name}</h3>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-wine">
                        {service.durationMin} min
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{service.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Slug: {service.slug}</span>
                      <span>
                        Precio:{" "}
                        {service.priceCents
                          ? new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                              maximumFractionDigits: 0,
                            }).format(service.priceCents)
                          : "A consultar"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={editingService?.id === service.id ? "primary" : "secondary"}
                      className="min-h-10 px-4 text-xs"
                      onClick={() => onEdit(service)}
                    >
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
                      {isDeletingId === service.id ? "Desactivando..." : "Desactivar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-rose-100 bg-rose-50/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine">
                {editingService ? "Editar servicio" : "Nuevo servicio"}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                {editingService ? editingService.name : "Carga una nueva prestacion"}
              </h3>
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
