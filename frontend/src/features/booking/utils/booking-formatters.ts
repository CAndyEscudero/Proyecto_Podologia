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
