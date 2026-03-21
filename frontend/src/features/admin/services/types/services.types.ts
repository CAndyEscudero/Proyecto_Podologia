import type { Service } from "../../../../shared/types/domain";

export type { Service } from "../../../../shared/types/domain";

export interface CreateServicePayload {
  name: string;
  slug: string;
  description: string;
  durationMin: number;
  priceCents?: number | null;
  isActive?: boolean;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {}

export type ServicesCollection = Service[];
