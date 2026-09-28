import { db, type Row, type Source } from './duckdb'

export type Scope = 'All' | Source
export type Snapshot = {
  summary: Row[]
  daily: Row[]
  products: Row[]
  events: Row[]
  quality: Row[]
  concentration: Row[]
}

const scoped = (scope: Scope) => (scope === 'All' ? '' : `AND marketplace = '${scope}'`)

export async function getSnapshot(scope: Scope): Promise<Snapshot> {
  const filter = scoped(scope)
  const summary = await db.query(`
    SELECT marketplace, CAST(MIN(event_date) AS VARCHAR) AS first_day,
      CAST(MAX(event_date) AS VARCHAR) AS last_day,
      COUNT(*)::INTEGER AS rows, COUNT(DISTINCT sku)::INTEGER AS skus,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(fee_amount), 2) AS fees,
      ROUND(SUM(other_amount), 2) AS other,
      ROUND(SUM(settlement_amount), 2) AS settlement,
      ROUND(SUM(CASE WHEN is_payout THEN settlement_amount ELSE 0 END), 2) AS payouts,
      ROUND(SUM(CASE WHEN NOT is_payout THEN settlement_amount ELSE 0 END), 2) AS commerce_settlement
    FROM commerce_events WHERE 1=1 ${filter}
    GROUP BY marketplace ORDER BY marketplace`)
  const daily = await db.query(`
    SELECT CAST(event_date AS VARCHAR) AS day, marketplace,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(settlement_amount), 2) AS settlement
    FROM commerce_events WHERE NOT is_payout AND event_date IS NOT NULL ${filter}
    GROUP BY 1, 2 ORDER BY 1, 2`)
  const products = await db.query(`
    SELECT sku, marketplace, COUNT(*)::INTEGER AS rows,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(fee_amount), 2) AS fees,
      ROUND(SUM(settlement_amount), 2) AS settlement,
      ROUND(100 * -SUM(fee_amount) / NULLIF(SUM(sales_amount), 0), 1) AS fee_rate
    FROM commerce_events WHERE sku IS NOT NULL AND NOT is_payout ${filter}
    GROUP BY sku, marketplace ORDER BY sales DESC`)
  const events = await db.query(`
    SELECT marketplace, event_type, COUNT(*)::INTEGER AS rows,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(fee_amount), 2) AS fees,
      ROUND(SUM(settlement_amount), 2) AS settlement
    FROM commerce_events WHERE 1=1 ${filter}
    GROUP BY 1, 2 ORDER BY 1, 2`)
  const quality = await db.query(`
    SELECT marketplace, COUNT(*)::INTEGER AS rows,
      SUM(CASE WHEN event_date IS NULL THEN 1 ELSE 0 END)::INTEGER AS missing_dates,
      SUM(CASE WHEN sku IS NULL AND NOT is_payout THEN 1 ELSE 0 END)::INTEGER AS missing_skus,
      SUM(CASE WHEN ABS(sales_amount + fee_amount + other_amount - settlement_amount) > 0.02 THEN 1 ELSE 0 END)::INTEGER AS unreconciled_rows
    FROM commerce_events WHERE 1=1 ${filter} GROUP BY marketplace ORDER BY marketplace`)
  const concentration = await db.query(`
    WITH sku_sales AS (
      SELECT sku, SUM(sales_amount) AS sales
      FROM commerce_events WHERE sku IS NOT NULL AND NOT is_payout ${filter}
      GROUP BY sku HAVING SUM(sales_amount) > 0
    ), ranked AS (
      SELECT sku, ROUND(sales, 2) AS sales,
        ROW_NUMBER() OVER (ORDER BY sales DESC)::INTEGER AS rank,
        ROUND(100 * SUM(sales) OVER (ORDER BY sales DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / SUM(sales) OVER (), 1) AS cumulative_pct
      FROM sku_sales
    ) SELECT * FROM ranked ORDER BY rank`)
  return { summary, daily, products, events, quality, concentration }
}

export async function getSchema(): Promise<Row[]> {
  return db.query(`SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'main' AND table_name IN ('commerce_events', 'amazon_raw', 'noon_raw')
    ORDER BY CASE table_name WHEN 'commerce_events' THEN 0 ELSE 1 END, table_name, ordinal_position`)
}

export function value(row: Row, key: string): number {
  return Number(row[key] ?? 0)
}
export function label(row: Row, key: string): string {
  return String(row[key] ?? '')
}
