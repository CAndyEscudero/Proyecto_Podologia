import type { Dispatch, SetStateAction } from "react";
import type { Appointment, AppointmentStatus, AvailabilityRule, BlockedDate, BusinessSettings, Service, User } from "../../../../shared/types/domain";
import type { AdminNavigationItem } from "../../navigation/types/navigation.types";
import type { CreateAvailabilityRulePayload, CreateBlockedDatePayload, UpdateAvailabilityRulePayload } from "../../availability/types/availability.types";
import type { UpdateBusinessSettingsPayload } from "../../business-settings/types/business-settings.types";
import type { CreateServicePayload, ServiceFormValues, UpdateServicePayload } from "../../services/types/services.types";

export type { Appointment, AppointmentStatus } from "../../../../shared/types/domain";

export interface AdminSummaryItem {
  label: string;
  value: string;
  copy?: string;
}

export interface AppointmentFilters {
  dateFrom: string;
  dateTo: string;
  status: AppointmentStatus | "";
  client: string;
  serviceId: string;
}

export interface AppointmentQueryParams {
  dateFrom?: string;
  dateTo?: string;
  status?: AppointmentStatus;
  client?: string;
  serviceId?: string;
}

export interface AppointmentClientPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface CreateAppointmentPayload {
  serviceId: number;
  date: string;
  startTime: string;
  client: AppointmentClientPayload;
}

export interface UpdateAppointmentPayload {
  status?: AppointmentStatus;
  notes?: string;
  client?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
}

export interface RescheduleAppointmentPayload {
  date: string;
  startTime: string;
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus;
}

export interface CreateAppointmentResponseShape {
  message: string;
  appointment: Appointment;
}

export type AppointmentManagerMode = "create" | "edit" | "reschedule";

export type AppointmentTableView = "timeline" | "table";

export interface AppointmentsTableProps {
  appointments: Appointment[];
  services: Service[];
  filters: AppointmentFilters;
  onFiltersChange: Dispatch<SetStateAction<AppointmentFilters>>;
  onStatusChange: (id: number, status: AppointmentStatus) => Promise<void> | void;
  onSelectEdit: (appointment: Appointment) => void;
  onSelectReschedule: (appointment: Appointment) => void;
  onDeleteAppointment: (id: number) => Promise<void> | void;
  isLoading: boolean;
  isUpdatingId: number | null;
  isDeletingId: number | null;
  selectedAppointmentId?: number;
}

export interface AppointmentCreateFormValues {
  serviceId: number | "";
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  clientNotes?: string;
}

export interface AppointmentEditFormValues {
  status: AppointmentStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  clientNotes?: string;
  appointmentNotes?: string;
}

export interface AppointmentRescheduleFormValues {
  date: string;
  startTime: string;
}

export interface AppointmentsManagerProps {
  services: Service[];
  mode: AppointmentManagerMode;
  selectedAppointment: Appointment | null;
  onModeChange: (mode: AppointmentManagerMode) => void;
  onCreate: (
    payload: CreateAppointmentPayload,
    onSuccess?: () => void
  ) => Promise<void> | void;
  onUpdate: (id: number, payload: UpdateAppointmentPayload) => Promise<void> | void;
  onReschedule: (id: number, payload: RescheduleAppointmentPayload) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
  isSubmitting: boolean;
  isDeletingId: number | null;
  availableModes?: AppointmentManagerMode[];
}

export type DashboardTab = "appointmentCreate" | "appointmentManage" | "services" | "availability" | "business";

export interface DashboardSummaryItem {
  label: string;
  value: string;
  copy: string;
}

export interface AdminDashboardState {
  appointments: Appointment[];
  services: Service[];
  rules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  businessSettings: BusinessSettings | null;
  selectedAppointment: Appointment | null;
  editingService: Service | null;
  editingRule: AvailabilityRule | null;
  activeTab: DashboardTab;
  appointmentMode: AppointmentManagerMode;
  filters: AppointmentFilters;
}

export interface AdminDashboardContextResponse {
  user: User;
  services: Service[];
  rules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  businessSettings: BusinessSettings;
  appointments: Appointment[];
}

export interface DashboardNavigationItem extends AdminNavigationItem {
  id: "appointments" | "services" | "availability" | "business";
}

export interface HandleCreateService {
  payload: CreateServicePayload;
  onSuccess?: () => void;
}

export interface HandleUpdateService {
  id: number;
  payload: UpdateServicePayload;
  onSuccess?: () => void;
}

export interface HandleCreateRule {
  payload: CreateAvailabilityRulePayload;
  onSuccess?: () => void;
}

export interface HandleUpdateRule {
  id: number;
  payload: UpdateAvailabilityRulePayload;
  onSuccess?: () => void;
}

export interface HandleCreateBlockedDate {
  payload: CreateBlockedDatePayload;
  onSuccess?: () => void;
}

export interface HandleUpdateBusinessSettings {
  payload: UpdateBusinessSettingsPayload;
}

export interface ServiceEditorHandlers {
  onEdit: Dispatch<SetStateAction<Service | null>>;
  onCancelEdit: () => void;
}

export interface RuleEditorHandlers {
  onEditRule: Dispatch<SetStateAction<AvailabilityRule | null>>;
  onCancelEditRule: () => void;
}

export type { ServiceFormValues };
