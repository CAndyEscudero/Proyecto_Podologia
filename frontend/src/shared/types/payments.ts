import type { PaymentOption, PaymentStatus } from "./domain";

export interface PaymentSummary {
  priceCents: number | null;
  depositCents: number | null;
  paymentStatus: PaymentStatus;
  paymentOption: PaymentOption;
}
