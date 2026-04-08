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

export function calculateDepositCents(
  priceCents: number | null | undefined,
  depositPercentage = 50
): number | null {
  if (!priceCents || priceCents <= 0) {
    return null;
  }

  if (!Number.isInteger(depositPercentage) || depositPercentage <= 0 || depositPercentage > 100) {
    return null;
  }

  return Math.ceil(priceCents * (depositPercentage / 100));
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
