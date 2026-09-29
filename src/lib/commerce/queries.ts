import type { Scope } from './types'

export function analyticsQueries(scope: Scope) {
  const filter = scope === 'All' ? '' : `AND marketplace = '${scope}'`
  return {
    summary: `
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
    GROUP BY marketplace ORDER BY marketplace`,
    daily: `
    SELECT CAST(event_date AS VARCHAR) AS day, marketplace,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(settlement_amount), 2) AS settlement
    FROM commerce_events WHERE NOT is_payout AND event_date IS NOT NULL ${filter}
    GROUP BY 1, 2 ORDER BY 1, 2`,
    products: `
    SELECT sku, marketplace, COUNT(*)::INTEGER AS rows,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(fee_amount), 2) AS fees,
      ROUND(SUM(settlement_amount), 2) AS settlement,
      ROUND(100 * -SUM(fee_amount) / NULLIF(SUM(sales_amount), 0), 1) AS fee_rate
    FROM commerce_events WHERE sku IS NOT NULL AND NOT is_payout ${filter}
    GROUP BY sku, marketplace ORDER BY sales DESC`,
    events: `
    SELECT marketplace, event_type, COUNT(*)::INTEGER AS rows,
      ROUND(SUM(sales_amount), 2) AS sales,
      ROUND(SUM(fee_amount), 2) AS fees,
      ROUND(SUM(settlement_amount), 2) AS settlement
    FROM commerce_events WHERE 1=1 ${filter}
    GROUP BY 1, 2 ORDER BY 1, 2`,
    quality: `
    SELECT marketplace, COUNT(*)::INTEGER AS rows,
      SUM(CASE WHEN event_date IS NULL THEN 1 ELSE 0 END)::INTEGER AS missing_dates,
      SUM(CASE WHEN sku IS NULL AND NOT is_payout THEN 1 ELSE 0 END)::INTEGER AS missing_skus,
      SUM(CASE WHEN ABS(sales_amount + fee_amount + other_amount - settlement_amount) > 0.02 THEN 1 ELSE 0 END)::INTEGER AS unreconciled_rows
    FROM commerce_events WHERE 1=1 ${filter} GROUP BY marketplace ORDER BY marketplace`,
    concentration: `
    WITH sku_sales AS (
      SELECT sku, SUM(sales_amount) AS sales
      FROM commerce_events WHERE sku IS NOT NULL AND NOT is_payout ${filter}
      GROUP BY sku HAVING SUM(sales_amount) > 0
    ), ranked AS (
      SELECT sku, ROUND(sales, 2) AS sales,
        ROW_NUMBER() OVER (ORDER BY sales DESC)::INTEGER AS rank,
        ROUND(100 * SUM(sales) OVER (ORDER BY sales DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / SUM(sales) OVER (), 1) AS cumulative_pct
      FROM sku_sales
    ) SELECT * FROM ranked ORDER BY rank`,
  }
}

export const schemaQuery = `SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'main' AND table_name IN ('commerce_events', 'amazon_raw', 'noon_raw')
    ORDER BY CASE table_name WHEN 'commerce_events' THEN 0 ELSE 1 END, table_name, ordinal_position`

export const defaultQuery = `SELECT
  marketplace,
  COUNT(*) AS events,
  ROUND(SUM(sales_amount), 2) AS reported_sales,
  ROUND(SUM(fee_amount), 2) AS fees,
  ROUND(SUM(settlement_amount), 2) AS settlement
FROM commerce_events
WHERE NOT is_payout
GROUP BY marketplace
ORDER BY reported_sales DESC;`

export function readOnlyQuery(input: string) {
  const statement = input.trim().replace(/;\s*$/, '')
  if (!/^(SELECT|WITH)\b/i.test(statement) || statement.includes(';')) {
    throw new Error('Enter one SELECT or WITH query. The SQL workspace is read-only.')
  }
  return `SELECT * FROM (${statement}) AS lab_query LIMIT 200`
}
