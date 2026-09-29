import { query } from '@/lib/duckdb/runtime'
import { analyticsQueries, schemaQuery } from './queries'
import type {
  ConcentrationRow,
  DailyPoint,
  DailyRow,
  EventRow,
  ProductRow,
  QualityRow,
  SchemaRow,
  Scope,
  Snapshot,
  SummaryRow,
} from './types'

export async function getSnapshot(scope: Scope): Promise<Snapshot> {
  const sql = analyticsQueries(scope)
  const [summary, daily, products, events, quality, concentration] = await Promise.all([
    query<SummaryRow>(sql.summary),
    query<DailyRow>(sql.daily),
    query<ProductRow>(sql.products),
    query<EventRow>(sql.events),
    query<QualityRow>(sql.quality),
    query<ConcentrationRow>(sql.concentration),
  ])
  return { summary, daily, products, events, quality, concentration }
}
export const getSchema = () => query<SchemaRow>(schemaQuery)

export function deriveAnalytics(snapshot: Snapshot) {
  const total = (key: keyof SummaryRow) =>
    snapshot.summary.reduce((sum, row) => sum + Number(row[key] ?? 0), 0)
  const sales = total('sales'),
    fees = total('fees'),
    payouts = total('payouts')
  const days = new Map<string, DailyPoint>()
  for (const row of snapshot.daily) {
    const point = days.get(row.day) ?? { day: row.day, Amazon: null, Noon: null }
    point[row.marketplace] = row.sales
    days.set(row.day, point)
  }
  const dates = snapshot.summary
    .flatMap((row) => [row.first_day, row.last_day])
    .filter((date): date is string => !!date)
    .sort()
  const topThree =
    snapshot.concentration[Math.min(2, snapshot.concentration.length - 1)]?.cumulative_pct ?? 0
  const adjustments = total('other') - payouts
  const settlement = total('commerce_settlement')
  const metricSources = (getAmount: (row: SummaryRow) => number) => {
    const values = snapshot.summary.map((row) => ({
      source: row.marketplace,
      amount: getAmount(row),
    }))
    const scale = Math.max(...values.map((row) => Math.abs(row.amount)), 1)
    return values.map((row) => ({ ...row, width: (Math.abs(row.amount) / scale) * 100 }))
  }
  return {
    sales,
    fees,
    payouts,
    adjustments,
    settlement,
    metricSources: {
      sales: metricSources((row) => row.sales),
      fees: metricSources((row) => row.fees),
      adjustments: metricSources((row) => row.other - row.payouts),
      settlement: metricSources((row) => row.commerce_settlement),
    },
    bridge: [
      { name: 'Sales', amount: sales, range: [0, sales] },
      { name: 'Fees', amount: fees, range: [sales, sales + fees] },
      { name: 'Other', amount: adjustments, range: [sales + fees, sales + fees + adjustments] },
      { name: 'Settlement', amount: settlement, range: [0, settlement] },
    ],
    rows: total('rows'),
    feeRate: sales ? (-100 * fees) / sales : 0,
    topThree,
    topCount: Math.min(3, snapshot.concentration.length),
    highFee: [...snapshot.products]
      .filter((row) => row.sales > 0 && row.fee_rate != null)
      .sort((a, b) => b.fee_rate! - a.fee_rate!)[0],
    unmatched: snapshot.quality.reduce((sum, row) => sum + row.unreconciled_rows, 0),
    days: [...days.values()],
    firstDay: dates[0],
    lastDay: dates.at(-1),
    periodsDiffer:
      new Set(snapshot.summary.map((row) => `${row.first_day}/${row.last_day}`)).size > 1,
    coverage: snapshot.summary
      .map(
        (row) => `${row.marketplace} ${row.first_day ?? 'undated'} – ${row.last_day ?? 'undated'}`,
      )
      .join(' · '),
  }
}
export type Analytics = ReturnType<typeof deriveAnalytics>
export const filterProducts = (rows: ProductRow[], search: string) =>
  rows.filter((row) => row.sku.toLowerCase().includes(search.toLowerCase()))
export const feeProducts = (rows: ProductRow[]) =>
  rows.filter((row) => row.sales > 0 && row.fee_rate != null)
