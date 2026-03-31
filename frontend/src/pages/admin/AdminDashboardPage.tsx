import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { CalendarClock, Menu } from "lucide-react";
import type { AxiosError } from "axios";
import { AdminSummary } from "../../features/admin/appointments/components/AdminSummary";
import { AppointmentsManager } from "../../features/admin/appointments/components/AppointmentsManager";
import { AppointmentsTable } from "../../features/admin/appointments/components/AppointmentsTable";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  rescheduleAppointment,
  updateAppointment,
  updateAppointmentStatus,
} from "../../features/admin/appointments/api/appointments.api";
import { AdminSidebar } from "../../features/admin/navigation/components/AdminSidebar";
import {
  createAvailabilityRule,
  createBlockedDate,
  deleteAvailabilityRule,
  deleteBlockedDate,
  getAvailabilityRules,
  getBlockedDates,
  updateAvailabilityRule,
} from "../../features/admin/availability/api/availability.api";
import { AvailabilityManager } from "../../features/admin/availability/components/AvailabilityManager";
import type {
  CreateAvailabilityRulePayload,
  CreateBlockedDatePayload,
  UpdateAvailabilityRulePayload,
} from "../../features/admin/availability/types/availability.types";
import { getBusinessSettings, updateBusinessSettings } from "../../features/admin/business-settings/api/business-settings.api";
import { BusinessSettingsPanel } from "../../features/admin/business-settings/components/BusinessSettingsPanel";
import type { UpdateBusinessSettingsPayload } from "../../features/admin/business-settings/types/business-settings.types";
import { getMe } from "../../features/admin/auth/api/auth.api";
import { createService, deleteService, getServices, updateService } from "../../features/admin/services/api/services.api";
import { ServicesManager } from "../../features/admin/services/components/ServicesManager";
import { TeamManager } from "../../features/admin/team/components/TeamManager";
import type {
  AppointmentFilters,
  AppointmentManagerMode,
  AppointmentStatus,
  CreateAppointmentPayload,
  DashboardNavigationItem,
  DashboardTab,
  DashboardSummaryItem,
  RescheduleAppointmentPayload,
  UpdateAppointmentPayload,
} from "../../features/admin/appointments/types/appointments.types";
import type {
  Service,
  AvailabilityRule,
  BlockedDate,
  BusinessSettings,
  Appointment,
  Professional,
  User,
} from "../../shared/types/domain";
import type { CreateServicePayload, UpdateServicePayload } from "../../features/admin/services/types/services.types";
import type {
  CreateProfessionalPayload,
  UpdateProfessionalPayload,
} from "../../features/admin/team/types/team.types";
import type { ApiErrorResponse } from "../../shared/types/api";
import { clearStoredToken } from "../../shared/utils/auth";
import {
  getNextProfessionalId,
  getStoredProfessionals,
  saveStoredProfessionals,
  sortProfessionals,
} from "../../shared/utils/professionals";

export function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>(() => getStoredProfessionals());
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("appointmentCreate");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<AppointmentFilters>({
    dateFrom: dayjs().format("YYYY-MM-DD"),
    dateTo: dayjs().add(6, "day").format("YYYY-MM-DD"),
    status: "",
    client: "",
    serviceId: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [appointmentMode, setAppointmentMode] = useState<AppointmentManagerMode>("edit");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isDeletingAppointmentId, setIsDeletingAppointmentId] = useState<number | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isDeletingServiceId, setIsDeletingServiceId] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSavingProfessional, setIsSavingProfessional] = useState(false);
  const [isUpdatingProfessionalId, setIsUpdatingProfessionalId] = useState<number | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isDeletingRuleId, setIsDeletingRuleId] = useState<number | null>(null);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [isSavingBlockedDate, setIsSavingBlockedDate] = useState(false);
  const [isDeletingBlockedDateId, setIsDeletingBlockedDateId] = useState<number | null>(null);
  const [isSavingBusinessSettings, setIsSavingBusinessSettings] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [
          meResponse,
          servicesResponse,
          rulesResponse,
          blockedDatesResponse,
          businessSettingsResponse,
          appointmentsResponse,
        ] = await Promise.all([
          getMe(),
          getServices(),
          getAvailabilityRules(),
          getBlockedDates(),
          getBusinessSettings(),
          getAppointments(buildAppointmentsParams(filters)),
        ]);
        setUser(meResponse.user);
        setServices(servicesResponse);
        setRules(rulesResponse);
        setBlockedDates(blockedDatesResponse);
        setBusinessSettings(businessSettingsResponse);
        setAppointments(appointmentsResponse);
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo cargar el contexto del panel"));
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    async function fetchAppointments() {
      await loadAppointments(filters);
    }

    if (activeTab === "appointmentManage") {
      void fetchAppointments();
    }
  }, [filters, activeTab]);

  useEffect(() => {
    saveStoredProfessionals(professionals);
  }, [professionals]);

  async function loadAppointments(activeFilters: AppointmentFilters = filters) {
    try {
      setIsLoading(true);
      const data = await getAppointments(buildAppointmentsParams(activeFilters));
      setAppointments(data);
      if (selectedAppointment) {
        const fresh = data.find((appointment) => appointment.id === selectedAppointment.id);
        if (fresh) {
          setSelectedAppointment(fresh);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar los turnos"));
    } finally {
      setIsLoading(false);
    }
  }

  const summaryItems = useMemo<DashboardSummaryItem[]>(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
    const todayAppointments = appointments.filter((appointment) => appointment.date === today);
    const tomorrowAppointments = appointments.filter((appointment) => appointment.date === tomorrow);
    const pending = appointments.filter((appointment) => appointment.status === "PENDING").length;
    const confirmed = appointments.filter((appointment) => appointment.status === "CONFIRMED").length;
    const uniqueClients = new Set(appointments.map((appointment) => appointment.clientId)).size;
    const totalDays =
      filters.dateFrom && filters.dateTo
        ? Math.max(dayjs(filters.dateTo).diff(dayjs(filters.dateFrom), "day") + 1, 1)
        : 1;
    const occupancyAverage = appointments.length ? (appointments.length / totalDays).toFixed(1) : "0.0";
    const topServiceEntry = Object.entries(
      appointments.reduce<Record<string, number>>((accumulator, appointment) => {
        accumulator[appointment.service.name] = (accumulator[appointment.service.name] || 0) + 1;
        return accumulator;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];
    const upcomingAppointment = [...appointments]
      .filter((appointment) =>
        dayjs(`${appointment.date}T${appointment.startTime}`).isAfter(dayjs())
      )
      .sort((a, b) =>
        dayjs(`${a.date}T${a.startTime}`).valueOf() - dayjs(`${b.date}T${b.startTime}`).valueOf()
      )[0];

    return [
      {
        label: "Turnos filtrados",
        value: String(appointments.length).padStart(2, "0"),
        copy: `${totalDays} dia(s) en rango activo`,
      },
      {
        label: "Turnos de hoy",
        value: String(todayAppointments.length).padStart(2, "0"),
        copy: `${tomorrowAppointments.length} programados para manana`,
      },
      {
        label: "Pendientes",
        value: String(pending).padStart(2, "0"),
        copy: `${String(confirmed).padStart(2, "0")} confirmados en la misma vista`,
      },
      {
        label: "Promedio diario",
        value: occupancyAverage,
        copy: "Carga media segun el rango filtrado",
      },
      {
        label: "Servicio lider",
        value: topServiceEntry ? String(topServiceEntry[1]).padStart(2, "0") : "00",
        copy: topServiceEntry ? topServiceEntry[0] : "Sin suficientes datos",
      },
      {
        label: "Proximo turno",
        value: upcomingAppointment ? upcomingAppointment.startTime : "--:--",
        copy: upcomingAppointment
          ? `${upcomingAppointment.client.firstName} ${upcomingAppointment.client.lastName} - ${dayjs(
              upcomingAppointment.date
            ).format("DD/MM")}`
          : "No hay turnos futuros en vista",
      },
      {
        label: "Clientes en vista",
        value: String(uniqueClients).padStart(2, "0"),
        copy: `${String(services.length).padStart(2, "0")} servicios activos`,
      },
      {
        label: "Reglas activas",
        value: String(rules.length).padStart(2, "0"),
        copy: `${String(blockedDates.length).padStart(2, "0")} bloqueos cargados`,
      },
    ];
  }, [appointments, blockedDates.length, filters.dateFrom, filters.dateTo, rules.length, services.length]);

  const navigationItems = useMemo<DashboardNavigationItem[]>(
    () => [
      {
        id: "appointments",
        label: "Turnos",
        copy: "Agenda diaria y gestion",
        badge: String(appointments.length).padStart(2, "0"),
        defaultChildId: "appointmentCreate",
        children: [
          { id: "appointmentCreate", label: "Alta manual" },
          { id: "appointmentManage", label: "Gestion de turnos" },
        ],
      },
      {
        id: "services",
        label: "Servicios",
        copy: "Oferta visible al paciente",
        badge: String(services.length).padStart(2, "0"),
      },
      {
        id: "team",
        label: "Equipo",
        copy: "Profesionales visibles en reserva",
        badge: String(professionals.filter((professional) => professional.isActive).length).padStart(2, "0"),
      },
      {
        id: "availability",
        label: "Disponibilidad",
        copy: "Reglas y fechas bloqueadas",
        badge: String(rules.length).padStart(2, "0"),
      },
      {
        id: "business",
        label: "Negocio",
        copy: "Datos institucionales y reglas",
        badge: businessSettings?.bookingWindowDays ? `${businessSettings.bookingWindowDays}d` : null,
      },
    ],
    [appointments.length, businessSettings?.bookingWindowDays, professionals, rules.length, services.length]
  );

  const activeNavigationItem =
    navigationItems.find(
      (item) => item.id === activeTab || item.children?.some((child) => child.id === activeTab)
    ) || navigationItems[0];

  async function handleStatusChange(id: number, status: AppointmentStatus) {
    try {
      setIsUpdatingId(id);
      await updateAppointmentStatus(id, status);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === id ? { ...appointment, status } : appointment
        )
      );
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el estado del turno"));
    } finally {
      setIsUpdatingId(null);
    }
  }

  async function handleCreateAppointment(payload: CreateAppointmentPayload, onSuccess?: () => void) {
    try {
      setIsSavingAppointment(true);
      const response = await createAppointment(payload);
      toast.success("Turno manual creado");
      setSelectedAppointment(response.appointment);
      setAppointmentMode("edit");
      onSuccess?.();
      await loadAppointments(filters);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el turno"));
    } finally {
      setIsSavingAppointment(false);
    }
  }

  async function handleUpdateAppointment(id: number, payload: UpdateAppointmentPayload) {
    try {
      setIsSavingAppointment(true);
      const updated = await updateAppointment(id, payload);
      setSelectedAppointment(updated);
      toast.success("Turno actualizado");
      await loadAppointments(filters);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el turno"));
    } finally {
      setIsSavingAppointment(false);
    }
  }

  async function handleRescheduleAppointment(id: number, payload: RescheduleAppointmentPayload) {
    try {
      setIsSavingAppointment(true);
      const updated = await rescheduleAppointment(id, payload);
      setSelectedAppointment(updated);
      toast.success("Turno reprogramado");
      await loadAppointments(filters);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo reprogramar el turno"));
    } finally {
      setIsSavingAppointment(false);
    }
  }

  async function handleDeleteAppointment(id: number) {
    try {
      setIsDeletingAppointmentId(id);
      await deleteAppointment(id);
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(null);
        setAppointmentMode("edit");
      }
      toast.success("Turno eliminado");
      await loadAppointments(filters);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo eliminar el turno"));
    } finally {
      setIsDeletingAppointmentId(null);
    }
  }

  async function handleCreateService(payload: CreateServicePayload, onSuccess?: () => void) {
    try {
      setIsSavingService(true);
      const created = await createService(payload);
      setServices((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Servicio creado");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el servicio"));
    } finally {
      setIsSavingService(false);
    }
  }

  async function handleUpdateService(id: number, payload: UpdateServicePayload, onSuccess?: () => void) {
    try {
      setIsSavingService(true);
      const updated = await updateService(id, payload);
      setServices((current) =>
        current
          .map((service) => (service.id === id ? updated : service))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingService(null);
      toast.success("Servicio actualizado");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el servicio"));
    } finally {
      setIsSavingService(false);
    }
  }

  async function handleDeleteService(id: number) {
    try {
      setIsDeletingServiceId(id);
      await deleteService(id);
      setServices((current) => current.filter((service) => service.id !== id));
      if (editingService?.id === id) {
        setEditingService(null);
      }
      toast.success("Servicio desactivado");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo desactivar el servicio"));
    } finally {
      setIsDeletingServiceId(null);
    }
  }

  async function handleCreateProfessional(
    payload: CreateProfessionalPayload,
    onSuccess?: () => void
  ) {
    try {
      setIsSavingProfessional(true);
      const timestamp = new Date().toISOString();
      const created: Professional = {
        id: getNextProfessionalId(professionals),
        fullName: payload.fullName.trim(),
        bio: payload.bio.trim(),
        acceptsAllServices: payload.acceptsAllServices,
        serviceIds: payload.acceptsAllServices ? [] : [...payload.serviceIds].sort((a, b) => a - b),
        isActive: payload.isActive ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      setProfessionals((current) => sortProfessionals([...current, created]));
      toast.success("Profesional creado");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el profesional"));
    } finally {
      setIsSavingProfessional(false);
    }
  }

  async function handleUpdateProfessional(
    id: number,
    payload: UpdateProfessionalPayload,
    onSuccess?: () => void
  ) {
    try {
      setIsSavingProfessional(true);
      setProfessionals((current) =>
        sortProfessionals(
          current.map((professional) =>
            professional.id === id
              ? {
                  ...professional,
                  ...payload,
                  fullName: payload.fullName?.trim() ?? professional.fullName,
                  bio: payload.bio?.trim() ?? professional.bio,
                  serviceIds: payload.acceptsAllServices
                    ? []
                    : payload.serviceIds
                      ? [...payload.serviceIds].sort((left, right) => left - right)
                      : professional.serviceIds,
                  updatedAt: new Date().toISOString(),
                }
              : professional
          )
        )
      );
      setEditingProfessional(null);
      toast.success("Profesional actualizado");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el profesional"));
    } finally {
      setIsSavingProfessional(false);
    }
  }

  async function handleToggleProfessionalStatus(professional: Professional) {
    try {
      setIsUpdatingProfessionalId(professional.id);
      const nextIsActive = !professional.isActive;
      const timestamp = new Date().toISOString();

      setProfessionals((current) =>
        sortProfessionals(
          current.map((item) =>
            item.id === professional.id
              ? {
                  ...item,
                  isActive: nextIsActive,
                  updatedAt: timestamp,
                }
              : item
          )
        )
      );

      if (editingProfessional?.id === professional.id) {
        setEditingProfessional({
          ...editingProfessional,
          isActive: nextIsActive,
          updatedAt: timestamp,
        });
      }

      toast.success(nextIsActive ? "Profesional activado" : "Profesional desactivado");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el profesional"));
    } finally {
      setIsUpdatingProfessionalId(null);
    }
  }

  async function handleCreateRule(payload: CreateAvailabilityRulePayload, onSuccess?: () => void) {
    try {
      setIsSavingRule(true);
      const created = await createAvailabilityRule(payload);
      setRules((current) =>
        [...current, created].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
      );
      toast.success("Regla horaria creada");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear la regla"));
    } finally {
      setIsSavingRule(false);
    }
  }

  async function handleUpdateRule(id: number, payload: UpdateAvailabilityRulePayload, onSuccess?: () => void) {
    try {
      setIsSavingRule(true);
      const updated = await updateAvailabilityRule(id, payload);
      setRules((current) =>
        current
          .map((rule) => (rule.id === id ? updated : rule))
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
      );
      setEditingRule(null);
      toast.success("Regla actualizada");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la regla"));
    } finally {
      setIsSavingRule(false);
    }
  }

  async function handleDeleteRule(id: number) {
    try {
      setIsDeletingRuleId(id);
      await deleteAvailabilityRule(id);
      setRules((current) => current.filter((rule) => rule.id !== id));
      if (editingRule?.id === id) {
        setEditingRule(null);
      }
      toast.success("Regla eliminada");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo eliminar la regla"));
    } finally {
      setIsDeletingRuleId(null);
    }
  }

  async function handleCreateBlockedDate(payload: CreateBlockedDatePayload, onSuccess?: () => void) {
    try {
      setIsSavingBlockedDate(true);
      const created = await createBlockedDate(payload);
      setBlockedDates((current) =>
        [...current, created].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      toast.success("Bloqueo cargado");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo bloquear la fecha"));
    } finally {
      setIsSavingBlockedDate(false);
    }
  }

  async function handleDeleteBlockedDate(id: number) {
    try {
      setIsDeletingBlockedDateId(id);
      await deleteBlockedDate(id);
      setBlockedDates((current) => current.filter((blockedDate) => blockedDate.id !== id));
      toast.success("Bloqueo eliminado");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo eliminar el bloqueo"));
    } finally {
      setIsDeletingBlockedDateId(null);
    }
  }

  async function handleUpdateBusinessSettings(payload: UpdateBusinessSettingsPayload) {
    try {
      setIsSavingBusinessSettings(true);
      const updated = await updateBusinessSettings(payload);
      setBusinessSettings(updated);
      toast.success("Configuracion actualizada");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la configuracion"));
    } finally {
      setIsSavingBusinessSettings(false);
    }
  }

  function handleSidebarChange(nextTab: string) {
    const typedNextTab = nextTab as DashboardTab;
    setActiveTab(typedNextTab);
    if (typedNextTab === "appointmentManage") {
      setAppointmentMode("edit");
    }
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <AdminSidebar
        items={navigationItems}
        activeTab={activeTab}
        onChange={handleSidebarChange}
        userName={user?.fullName}
        businessName={businessSettings?.businessName}
        onLogout={() => {
          clearStoredToken();
          window.location.href = "/admin/login";
        }}
        showCloseButton
        onClose={() => setIsSidebarOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] overflow-y-auto bg-[#fcf8f8] p-4 transition-transform duration-300 lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      />

      <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <AdminSidebar
          items={navigationItems}
          activeTab={activeTab}
          onChange={handleSidebarChange}
          userName={user?.fullName}
          businessName={businessSettings?.businessName}
          onLogout={() => {
            clearStoredToken();
            window.location.href = "/admin/login";
          }}
          className="hidden lg:block lg:sticky lg:top-6"
        />

        <div className="min-w-0 space-y-5">
          <div className="h-[84px] lg:hidden" />
          <div className="fixed left-3 right-3 top-3 z-30 lg:hidden">
            <div className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-rose-100/90 bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-[0_18px_36px_-28px_rgba(90,64,74,0.35)] backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-wine">Seccion activa</p>
              <p className="truncate font-semibold text-brand-ink">{activeNavigationItem.label}</p>
              <p className="truncate text-xs text-slate-500">{activeNavigationItem.copy}</p>
            </div>

            <div className="flex items-center gap-2">
              {activeNavigationItem.badge ? (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-brand-wine">
                  {activeNavigationItem.badge}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 bg-white text-brand-ink transition hover:border-brand-rose hover:text-brand-wine"
                aria-label="Abrir menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
          </div>

          {activeTab === "appointmentCreate" || activeTab === "appointmentManage" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Snapshot diario</p>
                  <p className="mt-1 text-sm text-slate-500">Resumen rapido para priorizar la operacion de agenda.</p>
                </div>
              </div>
              <AdminSummary items={summaryItems} />
            </div>
          ) : null}

          {activeTab === "appointmentCreate" || activeTab === "appointmentManage" ? (
            <div className="rounded-[1.3rem] border border-slate-200 bg-white p-1.5 shadow-[0_18px_32px_-28px_rgba(90,64,74,0.18)]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("appointmentCreate");
                    setAppointmentMode("create");
                  }}
                  className={`inline-flex min-h-11 items-center rounded-[1rem] px-4 text-sm font-semibold transition ${
                    activeTab === "appointmentCreate"
                      ? "bg-brand-wine text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brand-ink"
                  }`}
                >
                  Alta manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("appointmentManage");
                    setAppointmentMode(selectedAppointment ? appointmentMode : "edit");
                  }}
                  className={`inline-flex min-h-11 items-center rounded-[1rem] px-4 text-sm font-semibold transition ${
                    activeTab === "appointmentManage"
                      ? "bg-brand-wine text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brand-ink"
                  }`}
                >
                  Gestion de turnos
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "appointmentCreate" ? (
            <AppointmentsManager
              services={services}
              mode="create"
              selectedAppointment={selectedAppointment}
              onModeChange={setAppointmentMode}
              onCreate={handleCreateAppointment}
              onUpdate={handleUpdateAppointment}
              onReschedule={handleRescheduleAppointment}
              onDelete={handleDeleteAppointment}
              isSubmitting={isSavingAppointment}
              isDeletingId={isDeletingAppointmentId}
              availableModes={["create"]}
            />
          ) : null}

          {activeTab === "appointmentManage" ? (
            <div className="space-y-6">
              <AppointmentsTable
                appointments={appointments}
                services={services}
                filters={filters}
                onFiltersChange={setFilters}
                onStatusChange={handleStatusChange}
                onSelectEdit={(appointment) => {
                  setSelectedAppointment(appointment);
                  setAppointmentMode("edit");
                }}
                onSelectReschedule={(appointment) => {
                  setSelectedAppointment(appointment);
                  setAppointmentMode("reschedule");
                }}
                onDeleteAppointment={handleDeleteAppointment}
                isLoading={isLoading}
                isUpdatingId={isUpdatingId}
                isDeletingId={isDeletingAppointmentId}
                selectedAppointmentId={selectedAppointment?.id}
              />

              <AppointmentsManager
                services={services}
                mode={appointmentMode}
                selectedAppointment={selectedAppointment}
                onModeChange={setAppointmentMode}
                onCreate={handleCreateAppointment}
                onUpdate={handleUpdateAppointment}
                onReschedule={handleRescheduleAppointment}
                onDelete={handleDeleteAppointment}
                isSubmitting={isSavingAppointment}
                isDeletingId={isDeletingAppointmentId}
                availableModes={["edit", "reschedule"]}
              />
            </div>
          ) : null}

          {activeTab === "services" ? (
            <ServicesManager
              services={services}
              onCreate={handleCreateService}
              onUpdate={handleUpdateService}
              onDelete={handleDeleteService}
              isSaving={isSavingService}
              isDeletingId={isDeletingServiceId}
              editingService={editingService}
              onEdit={setEditingService}
              onCancelEdit={() => setEditingService(null)}
            />
          ) : null}

          {activeTab === "team" ? (
            <TeamManager
              professionals={professionals}
              services={services}
              onCreate={handleCreateProfessional}
              onUpdate={handleUpdateProfessional}
              onToggleStatus={handleToggleProfessionalStatus}
              isSaving={isSavingProfessional}
              isUpdatingId={isUpdatingProfessionalId}
              editingProfessional={editingProfessional}
              onEdit={setEditingProfessional}
              onCancelEdit={() => setEditingProfessional(null)}
            />
          ) : null}

          {activeTab === "availability" ? (
            <AvailabilityManager
              rules={rules}
              blockedDates={blockedDates}
              onCreateRule={handleCreateRule}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
              onCreateBlockedDate={handleCreateBlockedDate}
              onDeleteBlockedDate={handleDeleteBlockedDate}
              isSavingRule={isSavingRule}
              isDeletingRuleId={isDeletingRuleId}
              isSavingBlockedDate={isSavingBlockedDate}
              isDeletingBlockedDateId={isDeletingBlockedDateId}
              editingRule={editingRule}
              onEditRule={setEditingRule}
              onCancelEditRule={() => setEditingRule(null)}
            />
          ) : null}

          {activeTab === "business" ? (
            <BusinessSettingsPanel
              settings={businessSettings}
              onSave={handleUpdateBusinessSettings}
              isSaving={isSavingBusinessSettings}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function buildAppointmentsParams(filters: AppointmentFilters) {
  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    status: filters.status || undefined,
    client: filters.client || undefined,
    serviceId: filters.serviceId || undefined,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as AxiosError<ApiErrorResponse>;
  return apiError.response?.data?.message || fallback;
}
