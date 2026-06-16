// Utilidades de formato.

/** Formatea un importe en céntimos como moneda (por defecto EUR). */
export function formatMoney(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
