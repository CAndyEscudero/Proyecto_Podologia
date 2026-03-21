import type {
  AvailabilityRule,
  AvailabilityRuleType,
  AvailabilitySlot,
  BlockedDate,
  Service,
} from "../../../../shared/types/domain";

export type {
  AvailabilityRule,
  AvailabilityRuleType,
  AvailabilitySlot,
  BlockedDate,
} from "../../../../shared/types/domain";

export interface AvailableSlotsResponseShape {
  date: string;
  service: Pick<Service, "id" | "name" | "durationMin">;
  slots: AvailabilitySlot[];
}

export interface CreateAvailabilityRulePayload {
  dayOfWeek: number;
  type: AvailabilityRuleType;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateAvailabilityRulePayload extends Partial<CreateAvailabilityRulePayload> {}

export interface CreateBlockedDatePayload {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface AvailabilityRuleFormValues {
  dayOfWeek: number;
  type: AvailabilityRuleType;
  startTime: string;
  endTime: string;
}

export interface BlockedDateFormValues {
  date: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
}
