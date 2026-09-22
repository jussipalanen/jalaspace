/** Locale-aware formatting. Dates are formatted in `utils/format.ts` (d.m.yyyy in every language). */

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatArea(squareMetres: number, locale: string): string {
  return `${formatNumber(squareMetres, locale)} m²`
}

/** Formats an amount stored in euro cents. */
export function formatCurrency(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

/** Formats a whole percentage (85 → "85%" in English, "85 %" in Finnish). */
export function formatPercent(percent: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
    percent / 100,
  )
}
