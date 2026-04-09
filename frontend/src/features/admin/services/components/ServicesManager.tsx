import clsx from "clsx";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Stethoscope,
  Trash2,
} from "lucide-react";
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

interface ServiceActionMenuProps {
  service: Service;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
  isDeletingId: number | null;
  direction?: "up" | "down";
}

interface ActionIconButtonProps {
  ariaLabel: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
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
    setFocus,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: emptyValues,
  });
  const [query, setQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(services.length === 0);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editingService) {
      reset({
        name: editingService.name,
        slug: editingService.slug,
        description: editingService.description,
        durationMin: editingService.durationMin,
        priceCents: editingService.priceCents ?? "",
      });
      setIsComposerOpen(true);
      return;
    }

    reset(emptyValues);
  }, [editingService, reset]);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const timeoutId = window.setTimeout(() => {
      setFocus("name");
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [isComposerOpen, editingService, setFocus]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return services;
    }

    return services.filter((service) =>
      [service.name, service.slug, service.description].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [query, services]);

  function openCreateComposer() {
    onCancelEdit();
    reset(emptyValues);
    setIsComposerOpen(true);
    setOpenActionMenuId(null);
  }

  function closeComposer() {
    onCancelEdit();
    reset(emptyValues);
    setIsComposerOpen(false);
    setOpenActionMenuId(null);
  }

  function handleSelectEdit(service: Service) {
    onEdit(service);
    setIsComposerOpen(true);
    setOpenActionMenuId(null);
  }

  function onSubmit(values: ServiceFormValues): void {
    const payload: CreateServicePayload = {
      ...values,
      priceCents:
        values.priceCents === "" || values.priceCents === null ? undefined : values.priceCents,
    };

    if (editingService) {
      onUpdate(editingService.id, payload, () => {
        reset(emptyValues);
        closeComposer();
      });
      return;
    }

    onCreate(payload, () => {
      reset(emptyValues);
      setIsComposerOpen(false);
    });
  }

  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white shadow-[0_22px_50px_-36px_rgba(90,64,74,0.2)]">
      <div className="border-b border-slate-200/80 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-brand-wine">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                  Catalogo de prestaciones
                </p>
                <h2 className="mt-1 text-[1.7rem] font-semibold text-brand-ink">Servicios</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Administra la oferta real con una vista mas simple y operativa para editar rapido sin
              saturacion visual.
            </p>
          </div>

        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, slug o descripcion"
              className="field-input min-h-11 rounded-[1rem] pl-11"
            />
          </label>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredServices.length} resultados
            </span>
            <Button type="button" className="min-h-10 px-4 text-sm" onClick={openCreateComposer}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo servicio
            </Button>
          </div>
        </div>

        {isComposerOpen ? (
          <div ref={composerRef} className="mt-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/55 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine/85">
                  {editingService ? "Editar servicio" : "Nuevo servicio"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                  {editingService ? editingService.name : "Carga una nueva prestacion"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Completa solo los datos necesarios para publicar o ajustar el servicio.
                </p>
              </div>
              <button
                type="button"
                onClick={closeComposer}
                className="text-sm font-semibold text-slate-500 transition hover:text-brand-wine"
              >
                Cerrar
              </button>
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
                    <span className="mt-2 block text-xs text-slate-500">
                      Cargalo en pesos argentinos. Ejemplo: 25000 = ARS 25.000.
                    </span>
                  )}
                </label>
              </div>

              <Button type="submit" className="w-full md:w-auto md:px-6" disabled={isSaving}>
                {isSaving ? "Guardando..." : editingService ? "Guardar cambios" : "Crear servicio"}
              </Button>
            </form>
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
          {filteredServices.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">
              {services.length
                ? "No hay servicios que coincidan con la busqueda."
                : "Todavia no hay servicios activos."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/85 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Nombre</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Duracion</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Precio</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Slug</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em]">Gestion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service, index) => (
                    <tr
                      key={service.id}
                      className={clsx(
                        "border-b border-slate-100 align-top last:border-b-0",
                        index % 2 === 1 && "bg-slate-50/45",
                        editingService?.id === service.id && "bg-rose-50/40"
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-[240px]">
                          <p className="font-semibold text-brand-ink">{service.name}</p>
                          <p className="mt-1 max-w-[44ch] text-xs leading-5 text-slate-500">
                            {service.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-600">
                        {formatDuration(service.durationMin)}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-600">
                        {formatPrice(service.priceCents)}
                      </td>
                      <td className="px-4 py-4 text-slate-500">{service.slug}</td>
                      <td className="px-4 py-4">
                        <ServiceStatusBadge isActive={service.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <ServiceActionMenu
                            service={service}
                            isOpen={openActionMenuId === service.id}
                            onToggle={() =>
                              setOpenActionMenuId((current) => (current === service.id ? null : service.id))
                            }
                            onClose={() => setOpenActionMenuId(null)}
                            onEdit={handleSelectEdit}
                            onDelete={onDelete}
                            isDeletingId={isDeletingId}
                            direction={shouldOpenActionMenuUp(index, filteredServices.length) ? "up" : "down"}
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

      </div>
    </section>
  );
}

function ServiceActionMenu({
  service,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  isDeletingId,
  direction = "down",
}: ServiceActionMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <ActionIconButton
        ariaLabel={`Abrir acciones del servicio ${service.name}`}
        title="Mas acciones"
        onClick={onToggle}
      >
        <MoreHorizontal size={17} />
      </ActionIconButton>

      {isOpen ? (
        <div
          className={clsx(
            "absolute right-0 z-20 min-w-[190px] rounded-[1.1rem] border border-slate-200 bg-white p-2 shadow-xl",
            direction === "up" ? "bottom-12" : "top-12"
          )}
        >
          <button
            type="button"
            onClick={() => {
              onEdit(service);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-ink"
          >
            <PencilLine size={15} className="text-brand-wine" />
            Editar
          </button>
          <button
            type="button"
            disabled={isDeletingId === service.id}
            onClick={() => {
              onDelete(service.id);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 size={15} />
            {isDeletingId === service.id ? "Desactivando..." : "Desactivar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ServiceStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
        isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"
      )}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}

function ActionIconButton({ ariaLabel, title, onClick, children }: ActionIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-rose hover:text-brand-wine"
    >
      {children}
    </button>
  );
}

function formatDuration(durationMin: number) {
  return `${durationMin} min`;
}

function formatPrice(priceCents: number | null) {
  if (!priceCents) {
    return "A consultar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(priceCents);
}

function shouldOpenActionMenuUp(index: number, totalItems: number) {
  if (totalItems <= 1) {
    return false;
  }

  return index > 0 && index >= totalItems - 2;
}
