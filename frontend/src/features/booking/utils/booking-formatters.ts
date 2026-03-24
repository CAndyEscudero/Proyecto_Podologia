export function formatBookingPrice(priceCents: number | null | undefined): string {
  if (!priceCents) {
    return "Consultar";
  }

  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return formatter.format(priceCents);
}

export function calculateDepositCents(priceCents: number | null | undefined): number | null {
  if (!priceCents || priceCents <= 0) {
    return null;
  }

  return Math.ceil(priceCents * 0.5);
}

export function calculateRemainingCents(
  priceCents: number | null | undefined,
  depositCents: number | null | undefined
): number | null {
  if (!priceCents || priceCents <= 0) {
    return null;
  }

  return Math.max(priceCents - (depositCents || 0), 0);
}
