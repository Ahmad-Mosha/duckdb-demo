import type { Row } from './commerce/types'

export const money = (value: number, compact = false) =>
  new Intl.NumberFormat('en-EG', {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(value)
export const pct = (value: number) => `${value.toFixed(1)}%`
export const count = (value: number) => new Intl.NumberFormat('en').format(value)
export const shortDate = (date?: string) =>
  date
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
        new Date(date),
      )
    : '—'
export const value = (row: Row, key: string) => Number(row[key] ?? 0)
export const label = (row: Row, key: string) => String(row[key] ?? '')
