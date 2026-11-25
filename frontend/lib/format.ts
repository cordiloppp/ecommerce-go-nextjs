// Utilidades de formato.

/** Formatea un importe en centavos como moneda (por defecto MXN). */
export function formatMoney(cents: number, currency = "MXN"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
