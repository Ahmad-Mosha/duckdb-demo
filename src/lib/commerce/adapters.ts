import Papa from 'papaparse'
import type { Source } from './types'

const amount = (column: string) => `COALESCE(TRY_CAST(REPLACE("${column}", ',', '') AS DOUBLE), 0)`
export const rawTable = (source: Source) => (source === 'Amazon' ? 'amazon_raw' : 'noon_raw')

const projections: Record<Source, string> = {
  Amazon: `SELECT 'Amazon' AS marketplace,
    TRY_STRPTIME(SUBSTR("date/time", 1, 11), '%d %b %Y')::DATE AS event_date,
    NULLIF(TRIM(sku), '') AS sku, type AS event_type,
    TRY_CAST(NULLIF(quantity, '') AS INTEGER) AS quantity,
    ${amount('product sales')} AS sales_amount,
    ${amount('selling fees')} + ${amount('fba fees')} + ${amount('other transaction fees')} AS fee_amount,
    ${amount('shipping credits')} + ${amount('promotional rebates')} + ${amount('other')} AS other_amount,
    ${amount('total')} AS settlement_amount, type = 'Transfer' AS is_payout
    FROM amazon_raw`,
  Noon: `SELECT 'Noon' AS marketplace,
    TRY_CAST("Order Date" AS DATE) AS event_date,
    NULLIF(TRIM("Partner SKUs"), '') AS sku, "Transaction Type" AS event_type,
    NULL::INTEGER AS quantity,
    ${amount('Net Proceeds')} AS sales_amount,
    ${amount('Referral Fee including VAT')} + ${amount('Fullfilment & Logistics Fees including VAT')} + ${amount('Other Order Fees including VAT')} + ${amount('Non-Order Fees including VAT')} AS fee_amount,
    ${amount('Shipping Credits including VAT')} + ${amount('Order Subsidies including VAT')} + ${amount('Non-Order Subsidies including VAT')} + ${amount('Others including VAT')} AS other_amount,
    ${amount('Total')} AS settlement_amount, "Transaction Type" = 'payment' AS is_payout
    FROM noon_raw`,
}

const emptyProjection = `SELECT NULL::VARCHAR AS marketplace, NULL::DATE AS event_date,
  NULL::VARCHAR AS sku, NULL::VARCHAR AS event_type, NULL::INTEGER AS quantity,
  NULL::DOUBLE AS sales_amount, NULL::DOUBLE AS fee_amount, NULL::DOUBLE AS other_amount,
  NULL::DOUBLE AS settlement_amount, NULL::BOOLEAN AS is_payout WHERE FALSE`

export function normalizationSQL(sources: Source[]) {
  return `CREATE OR REPLACE VIEW commerce_events AS ${sources.length ? sources.map((source) => projections[source]).join(' UNION ALL ') : emptyProjection}`
}

export function parseReport(source: Source, data: Uint8Array) {
  const text = new TextDecoder().decode(data).replace(/^\uFEFF/, '')
  const csv = source === 'Amazon' ? text.split(/\r?\n/).slice(8).join('\n') : text
  const expectedStart =
    source === 'Amazon'
      ? /^"?date\/time"?,"?settlement id"?,"?type"?,"?order id"?,"?sku"?/
      : /^Contract,Contract Title,Reference Nr,Order Nr,Item Nr,/
  if (!expectedStart.test(csv))
    throw new Error(`File does not match the supported ${source} report layout.`)
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: 'greedy' })
  if (parsed.errors.length)
    throw new Error(`${source} CSV parsing failed: ${parsed.errors[0].message}`)
  const fields = parsed.meta.fields ?? []
  if (fields.length !== 22 || !parsed.data.length)
    throw new Error(`${source} report must contain 22 columns and at least one row.`)
  return Object.fromEntries(
    fields.map((field) => [field, parsed.data.map((row) => row[field] ?? '')]),
  )
}
