export type Source = 'Amazon' | 'Noon'
export type Scope = 'All' | Source
export type SessionMode = 'Demo' | 'Private'
export type Row = Record<string, unknown>

export interface SummaryRow extends Row {
  marketplace: Source
  first_day: string | null
  last_day: string | null
  rows: number
  skus: number
  sales: number
  fees: number
  other: number
  settlement: number
  payouts: number
  commerce_settlement: number
}
export interface ProductRow extends Row {
  sku: string
  marketplace: Source
  rows: number
  sales: number
  fees: number
  settlement: number
  fee_rate: number | null
}
export interface DailyRow extends Row {
  day: string
  marketplace: Source
  sales: number
  settlement: number
}
export interface EventRow extends Row {
  marketplace: Source
  event_type: string
  rows: number
  sales: number
  fees: number
  settlement: number
}
export interface QualityRow extends Row {
  marketplace: Source
  rows: number
  missing_dates: number
  missing_skus: number
  unreconciled_rows: number
}
export interface ConcentrationRow extends Row {
  sku: string
  sales: number
  rank: number
  cumulative_pct: number
}
export interface SchemaRow extends Row {
  table_name: string
  column_name: string
  data_type: string
}
export interface Snapshot {
  summary: SummaryRow[]
  daily: DailyRow[]
  products: ProductRow[]
  events: EventRow[]
  quality: QualityRow[]
  concentration: ConcentrationRow[]
}
export type DailyPoint = { day: string; Amazon: number | null; Noon: number | null }
export type QueryResult = { rows: Row[]; columns: string[]; elapsedMs: number }
export type ReportInput = { source: Source; data: Uint8Array }
