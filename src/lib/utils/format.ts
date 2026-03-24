/**
 * Singleton Intl.NumberFormat instances for COP currency formatting.
 * Avoids creating new instances on every call (expensive operation).
 */
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return 'N/A'
  return currencyFormatter.format(value)
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
