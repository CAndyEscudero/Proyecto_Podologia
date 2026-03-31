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
  UserRound,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { Button } from "../../../../shared/ui/button/Button";
import type {
  CreateProfessionalPayload,
  Professional,
  ProfessionalFormValues,
  Service,
  UpdateProfessionalPayload,
} from "../types/team.types";

const professionalSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ingresa un nombre valido").max(80, "Maximo 80 caracteres"),
    bio: z.string().trim().min(10, "Suma una descripcion breve").max(500, "Maximo 500 caracteres"),
    acceptsAllServices: z.boolean(),
    serviceIds: z.array(z.number()),
  })
  .superRefine((values, context) => {
    if (!values.acceptsAllServices && values.serviceIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["serviceIds"],
        message: "Selecciona al menos un servicio o habilita todos.",
      });
    }
  });

const emptyValues: ProfessionalFormValues = {
  fullName: "",
  bio: "",
  acceptsAllServices: true,
  serviceIds: [],
};

interface TeamManagerProps {
  professionals: Professional[];
  services: Service[];
  onCreate: (payload: CreateProfessionalPayload, onSuccess?: () => void) => void;
  onUpdate: (id: number, payload: UpdateProfessionalPayload, onSuccess?: () => void) => void;
  onToggleStatus: (professional: Professional) => void;
  isSaving: boolean;
  isUpdatingId: number | null;
  editingProfessional: Professional | null;
  onEdit: (professional: Professional) => void;
  onCancelEdit: () => void;
}

interface TeamActionMenuProps {
  professional: Professional;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: (professional: Professional) => void;
  onToggleStatus: (professional: Professional) => void;
  isUpdatingId: number | null;
  direction?: "up" | "down";
}

interface ActionIconButtonProps {
  ariaLabel: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
}

export function TeamManager({
  professionals,
  services,
  onCreate,
  onUpdate,
  onToggleStatus,
  isSaving,
  isUpdatingId,
  editingProfessional,
  onEdit,
  onCancelEdit,
}: TeamManagerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setFocus,
    setValue,
    formState: { errors },
  } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: emptyValues,
  });
  const [query, setQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(professionals.length === 0);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  const acceptsAllServices = watch("acceptsAllServices");
  const selectedServiceIds = watch("serviceIds");

  useEffect(() => {
    if (editingProfessional) {
      reset({
        fullName: editingProfessional.fullName,
        bio: editingProfessional.bio,
        acceptsAllServices: editingProfessional.acceptsAllServices,
        serviceIds: editingProfessional.serviceIds,
      });
      setIsComposerOpen(true);
      return;
    }

    reset(emptyValues);
  }, [editingProfessional, reset]);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const timeoutId = window.setTimeout(() => {
      setFocus("fullName");
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [editingProfessional, isComposerOpen, setFocus]);

  const filteredProfessionals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return professionals;
    }

    return professionals.filter((professional) =>
      [professional.fullName, professional.bio].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [professionals, query]);

  const serviceLabelsById = useMemo(
    () => new Map(services.map((service) => [service.id, service.name])),
    [services]
  );

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

  function handleSelectEdit(professional: Professional) {
    onEdit(professional);
    setIsComposerOpen(true);
    setOpenActionMenuId(null);
  }

  function handleToggleService(serviceId: number) {
    const nextServiceIds = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((currentId) => currentId !== serviceId)
      : [...selectedServiceIds, serviceId];

    setValue("serviceIds", nextServiceIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function handleToggleAllServices(nextValue: boolean) {
    setValue("acceptsAllServices", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (nextValue) {
      setValue("serviceIds", [], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }

  function onSubmit(values: ProfessionalFormValues): void {
    const payload: CreateProfessionalPayload = {
      fullName: values.fullName,
      bio: values.bio,
      acceptsAllServices: values.acceptsAllServices,
      serviceIds: values.acceptsAllServices ? [] : values.serviceIds,
    };

    if (editingProfessional) {
      onUpdate(editingProfessional.id, payload, () => {
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
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-brand-wine">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-wine/80">
                Equipo operativo
              </p>
              <h2 className="mt-1 text-[1.7rem] font-semibold text-brand-ink">Profesionales</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Carga el equipo disponible para que el paciente pueda elegir con quien atenderse y
            para ordenar mejor la operacion desde el panel.
          </p>
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
              placeholder="Buscar por nombre o descripcion"
              className="field-input min-h-11 rounded-[1rem] pl-11"
            />
          </label>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredProfessionals.length} resultados
            </span>
            <Button type="button" className="min-h-10 px-4 text-sm" onClick={openCreateComposer}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar profesional
            </Button>
          </div>
        </div>

        {isComposerOpen ? (
          <div
            ref={composerRef}
            className="mt-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/55 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine/85">
                  {editingProfessional ? "Editar profesional" : "Nuevo profesional"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-brand-ink">
                  {editingProfessional ? editingProfessional.fullName : "Suma una nueva persona al equipo"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Define a quien puede ver el paciente en el booking y que servicios puede cubrir.
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
                <span className="mb-2 block text-sm font-semibold text-brand-ink">Nombre completo</span>
                <input
                  type="text"
                  {...register("fullName")}
                  className="field-input"
                  placeholder="Carolina Perez"
                />
                {errors.fullName ? (
                  <span className="mt-2 block text-xs text-red-500">{errors.fullName.message}</span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-ink">Presentacion breve</span>
                <textarea
                  {...register("bio")}
                  className="field-input min-h-28 resize-none py-3"
                  placeholder="Especialista en podologia clinica, seguimiento y cuidado preventivo."
                />
                {errors.bio ? <span className="mt-2 block text-xs text-red-500">{errors.bio.message}</span> : null}
              </label>

              <div className="space-y-3 rounded-[1.15rem] border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">Servicios asignados</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Marca si atiende todo el catalogo o solo algunos servicios puntuales.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={acceptsAllServices}
                      onChange={(event) => handleToggleAllServices(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-wine focus:ring-brand-rose"
                    />
                    Atiende todos los servicios
                  </label>
                </div>

                {!acceptsAllServices ? (
                  services.length ? (
                    <div className="flex flex-wrap gap-2">
                      {services.map((service) => {
                        const isSelected = selectedServiceIds.includes(service.id);

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleToggleService(service.id)}
                            className={clsx(
                              "rounded-full border px-3 py-2 text-xs font-semibold transition",
                              isSelected
                                ? "border-brand-rose bg-rose-50 text-brand-wine"
                                : "border-slate-200 bg-white text-slate-600 hover:border-brand-rose hover:text-brand-wine"
                            )}
                          >
                            {service.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      Primero necesitas tener servicios cargados para asignar especialidades
                      puntuales.
                    </p>
                  )
                ) : null}

                {errors.serviceIds ? (
                  <span className="block text-xs text-red-500">{errors.serviceIds.message}</span>
                ) : null}
              </div>

              <Button type="submit" className="w-full md:w-auto md:px-6" disabled={isSaving}>
                {isSaving ? "Guardando..." : editingProfessional ? "Guardar cambios" : "Crear profesional"}
              </Button>
            </form>
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
          {filteredProfessionals.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">
              {professionals.length
                ? "No hay profesionales que coincidan con la busqueda."
                : "Todavia no cargaste profesionales en el equipo."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/85 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Nombre</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Estado</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.16em]">Servicios</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em]">Gestion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfessionals.map((professional, index) => (
                    <tr
                      key={professional.id}
                      className={clsx(
                        "border-b border-slate-100 align-top last:border-b-0",
                        index % 2 === 1 && "bg-slate-50/45",
                        editingProfessional?.id === professional.id && "bg-rose-50/40"
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-[260px]">
                          <p className="font-semibold text-brand-ink">{professional.fullName}</p>
                          <p className="mt-1 max-w-[48ch] text-xs leading-5 text-slate-500">
                            {professional.bio}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <ProfessionalStatusBadge isActive={professional.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[220px]">
                          <p className="font-medium text-slate-600">
                            {professional.acceptsAllServices
                              ? "Todos los servicios"
                              : `${professional.serviceIds.length} servicio(s) asignado(s)`}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {professional.acceptsAllServices
                              ? "Disponible para toda la agenda publicada."
                              : formatAssignedServices(professional.serviceIds, serviceLabelsById)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <TeamActionMenu
                            professional={professional}
                            isOpen={openActionMenuId === professional.id}
                            onToggle={() =>
                              setOpenActionMenuId((current) =>
                                current === professional.id ? null : professional.id
                              )
                            }
                            onClose={() => setOpenActionMenuId(null)}
                            onEdit={handleSelectEdit}
                            onToggleStatus={onToggleStatus}
                            isUpdatingId={isUpdatingId}
                            direction={shouldOpenActionMenuUp(index, filteredProfessionals.length) ? "up" : "down"}
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

function TeamActionMenu({
  professional,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onToggleStatus,
  isUpdatingId,
  direction = "down",
}: TeamActionMenuProps) {
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
        ariaLabel={`Abrir acciones del profesional ${professional.fullName}`}
        title="Mas acciones"
        onClick={onToggle}
      >
        <MoreHorizontal size={17} />
      </ActionIconButton>

      {isOpen ? (
        <div
          className={clsx(
            "absolute right-0 z-20 min-w-[210px] rounded-[1.1rem] border border-slate-200 bg-white p-2 shadow-xl",
            direction === "up" ? "bottom-12" : "top-12"
          )}
        >
          <button
            type="button"
            onClick={() => {
              onEdit(professional);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-ink"
          >
            <PencilLine size={15} className="text-brand-wine" />
            Editar
          </button>
          <button
            type="button"
            disabled={isUpdatingId === professional.id}
            onClick={() => {
              onToggleStatus(professional);
              onClose();
            }}
            className={clsx(
              "flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm transition disabled:cursor-wait disabled:opacity-70",
              professional.isActive
                ? "text-rose-600 hover:bg-rose-50"
                : "text-emerald-700 hover:bg-emerald-50"
            )}
          >
            {professional.isActive ? <UserRoundX size={15} /> : <UserRoundCheck size={15} />}
            {isUpdatingId === professional.id
              ? "Actualizando..."
              : professional.isActive
                ? "Desactivar"
                : "Activar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProfessionalStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
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

function formatAssignedServices(serviceIds: number[], serviceLabelsById: Map<number, string>) {
  const serviceNames = serviceIds
    .map((serviceId) => serviceLabelsById.get(serviceId))
    .filter((serviceName): serviceName is string => Boolean(serviceName));

  if (!serviceNames.length) {
    return "Sin servicios especificos asignados.";
  }

  if (serviceNames.length <= 3) {
    return serviceNames.join(", ");
  }

  return `${serviceNames.slice(0, 3).join(", ")} y ${serviceNames.length - 3} mas.`;
}

function shouldOpenActionMenuUp(index: number, totalItems: number) {
  if (totalItems <= 1) {
    return false;
  }

  return index > 0 && index >= totalItems - 2;
}
