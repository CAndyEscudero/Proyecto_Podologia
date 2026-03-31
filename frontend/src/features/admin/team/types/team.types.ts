import type { Professional, Service } from "../../../../shared/types/domain";

export type { Professional, Service } from "../../../../shared/types/domain";

export interface ProfessionalFormValues {
  fullName: string;
  bio: string;
  acceptsAllServices: boolean;
  serviceIds: number[];
}

export interface CreateProfessionalPayload {
  fullName: string;
  bio: string;
  acceptsAllServices: boolean;
  serviceIds: number[];
  isActive?: boolean;
}

export interface UpdateProfessionalPayload extends Partial<CreateProfessionalPayload> {}
