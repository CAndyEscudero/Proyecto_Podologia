export type UserRole = "OWNER" | "ADMIN" | "STAFF";
export type TenantStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
export type TenantDomainType = "PLATFORM_SUBDOMAIN" | "CUSTOM_SUBDOMAIN" | "CUSTOM_ROOT";
export type TenantDomainStatus = "PENDING" | "ACTIVE" | "FAILED";
export type TenantDomainSetupMode = "CNAME" | "A" | "MANUAL";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
export type PaymentOption = "DEPOSIT" | "FULL";
export type MercadoPagoConnectionStatus = "DISCONNECTED" | "PENDING" | "CONNECTED" | "ERROR";
export type MercadoPagoSetupMode = "OAUTH" | "MANUAL" | "NONE";

export type AvailabilityRuleType = "WORKING_HOURS" | "BREAK";

export interface User {
  id: number;
  tenantId?: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTenant {
  id: number;
  slug: string;
  name: string;
  businessType: string;
  hostname: string | null;
  domainType: TenantDomainType | null;
}

export interface TenantDomainSetup {
  mode: TenantDomainSetupMode;
  host: string;
  values: string[];
  summary: string;
}

export interface TenantDomain {
  id: number;
  hostname: string;
  isPrimary: boolean;
  type: TenantDomainType;
  status: TenantDomainStatus;
  verifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  setup: TenantDomainSetup;
}

export interface TenantDomainsOverview {
  platformApexDomain: string;
  platformDomainCnameTarget: string | null;
  platformDomainARecords: string[];
  sslStrategy: string;
  adminHostname: string | null;
  primaryDomain: TenantDomain | null;
  platformDomain: TenantDomain | null;
  customDomain: TenantDomain | null;
  domains: TenantDomain[];
}

export interface TenantDomainVerification {
  hostname: string;
  isValid: boolean;
  matchedRecordType: "CNAME" | "A" | null;
  actualCnameRecords: string[];
  actualARecords: string[];
  sslStrategy: string;
  message: string;
  domain: TenantDomain | null;
}

export interface TenantDomainVerificationResponse {
  overview: TenantDomainsOverview;
  verification: TenantDomainVerification;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentOption: PaymentOption;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentPreferenceId: string | null;
  paymentApprovedAt?: string | null;
  paymentExpiresAt?: string | null;
  priceCents: number | null;
  depositCents: number | null;
  notes: string | null;
  source: string;
  createdAt?: string;
  updatedAt?: string;
  client: Client;
  service: Service;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityRule {
  id: number;
  dayOfWeek: number;
  type: AvailabilityRuleType;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockedDate {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt?: string;
}

export interface BusinessSettings {
  id: number;
  businessName: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  appointmentGapMin: number;
  bookingWindowDays: number;
  depositPercentage: number;
  mercadoPagoEnabled: boolean;
  mercadoPagoPublicKey: string | null;
  hasMercadoPagoAccessToken: boolean;
  hasMercadoPagoWebhookSecret: boolean;
  mercadoPagoSetupMode: MercadoPagoSetupMode;
  mercadoPagoConnection: MercadoPagoConnectionSummary;
  transactionalEmailEnabled: boolean;
  transactionalEmailFromName: string | null;
  transactionalEmailReplyTo: string | null;
  whatsAppEnabled: boolean;
  whatsAppNumber: string | null;
  whatsAppDefaultMessage: string | null;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MercadoPagoConnectionSummary {
  status: MercadoPagoConnectionStatus;
  isConnected: boolean;
  isOAuth: boolean;
  accountLabel: string | null;
  publicKey: string | null;
  connectedAt: string | null;
  expiresAt: string | null;
  lastRefreshedAt: string | null;
  lastWebhookAt: string | null;
  lastWebhookStatus: string | null;
  lastError: string | null;
  hasRefreshToken: boolean;
}

export interface PublicBusinessSettings {
  businessName: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  bookingWindowDays: number;
  depositPercentage: number;
  timezone: string;
  whatsAppEnabled: boolean;
  whatsAppNumber: string | null;
  whatsAppDefaultMessage: string | null;
  currentHostname: string | null;
  currentDomainType: TenantDomainType | null;
  adminHostname: string | null;
  primaryPublicHostname: string | null;
  primaryPublicDomainType: TenantDomainType | null;
  shouldRedirectToPreferredDomain: boolean;
}
