import * as duckdb from '@duckdb/duckdb-wasm'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'

export type Source = 'Amazon' | 'Noon'
export type Row = Record<string, unknown>

export function looksLikeReport(source: Source, text: string) {
  return source === 'Amazon'
    ? /["']?date\/time["']?,["']?settlement id["']?,["']?type["']?,["']?order id["']?,["']?sku["']?/.test(
        text,
      )
    : text
        .replace(/^\uFEFF/, '')
        .startsWith('Contract,Contract Title,Reference Nr,Order Nr,Item Nr,')
}

const bundles: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
}

const number = (column: string) => `COALESCE(TRY_CAST(REPLACE("${column}", ',', '') AS DOUBLE), 0)`

export class CommerceDatabase {
  private database?: duckdb.AsyncDuckDB
  private connection?: duckdb.AsyncDuckDBConnection
  private loaded = new Set<Source>()

  get sources() {
    return [...this.loaded]
  }

  async initialize() {
    if (this.connection) return
    const bundle = await duckdb.selectBundle(bundles)
    const worker = new Worker(bundle.mainWorker!)
    const database = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
    await database.instantiate(bundle.mainModule, bundle.pthreadWorker)
    this.database = database
    this.connection = await database.connect()
    await this.refreshViews()
  }

  async query(sql: string): Promise<Row[]> {
    if (!this.connection) throw new Error('DuckDB is not ready')
    const result = await this.connection.query(sql)
    return result.toArray().map((row) => row.toJSON() as Row)
  }

  async load(source: Source, data: Uint8Array) {
    if (!this.database) throw new Error('DuckDB is not ready')
    const text = new TextDecoder().decode(data.slice(0, 4096))
    if (!looksLikeReport(source, text))
      throw new Error(`This does not look like the supported ${source} report.`)

    const path = `${source.toLowerCase()}-upload.csv`
    await this.database.registerFileBuffer(path, data)
    const skip = source === 'Amazon' ? ', skip=8' : ''
    await this.query(
      `CREATE OR REPLACE TABLE ${source.toLowerCase()}_raw AS SELECT * FROM read_csv_auto('${path}', header=true, all_varchar=true, delim=',', quote='"', escape='"', null_padding=true${skip})`,
    )
    this.loaded.add(source)
    await this.refreshViews()
  }

  async clear() {
    for (const source of this.loaded)
      await this.query(`DROP TABLE IF EXISTS ${source.toLowerCase()}_raw`)
    this.loaded.clear()
    await this.refreshViews()
  }

  async keepOnly(source: Source) {
    for (const loaded of this.loaded) {
      if (loaded !== source) await this.query(`DROP TABLE IF EXISTS ${loaded.toLowerCase()}_raw`)
    }
    this.loaded = new Set([source])
    await this.refreshViews()
  }

  private async refreshViews() {
    const views: string[] = []
    if (this.loaded.has('Amazon')) {
      views.push(`
        SELECT 'Amazon' AS marketplace,
          TRY_STRPTIME(SUBSTR("date/time", 1, 11), '%d %b %Y')::DATE AS event_date,
          NULLIF(TRIM(sku), '') AS sku,
          type AS event_type,
          TRY_CAST(NULLIF(quantity, '') AS INTEGER) AS quantity,
          ${number('product sales')} AS sales_amount,
          ${number('selling fees')} + ${number('fba fees')} + ${number('other transaction fees')} AS fee_amount,
          ${number('shipping credits')} + ${number('promotional rebates')} + ${number('other')} AS other_amount,
          ${number('total')} AS settlement_amount,
          type = 'Transfer' AS is_payout
        FROM amazon_raw`)
    }
    if (this.loaded.has('Noon')) {
      views.push(`
        SELECT 'Noon' AS marketplace,
          TRY_CAST("Order Date" AS DATE) AS event_date,
          NULLIF(TRIM("Partner SKUs"), '') AS sku,
          "Transaction Type" AS event_type,
          NULL::INTEGER AS quantity,
          ${number('Net Proceeds')} AS sales_amount,
          ${number('Referral Fee including VAT')} + ${number('Fullfilment & Logistics Fees including VAT')} + ${number('Other Order Fees including VAT')} + ${number('Non-Order Fees including VAT')} AS fee_amount,
          ${number('Shipping Credits including VAT')} + ${number('Order Subsidies including VAT')} + ${number('Non-Order Subsidies including VAT')} + ${number('Others including VAT')} AS other_amount,
          ${number('Total')} AS settlement_amount,
          "Transaction Type" = 'payment' AS is_payout
        FROM noon_raw`)
    }
    if (!views.length) {
      await this.query(`CREATE OR REPLACE VIEW commerce_events AS
        SELECT NULL::VARCHAR AS marketplace, NULL::DATE AS event_date, NULL::VARCHAR AS sku,
          NULL::VARCHAR AS event_type, NULL::INTEGER AS quantity, NULL::DOUBLE AS sales_amount,
          NULL::DOUBLE AS fee_amount, NULL::DOUBLE AS other_amount,
          NULL::DOUBLE AS settlement_amount, NULL::BOOLEAN AS is_payout WHERE FALSE`)
      return
    }
    await this.query(`CREATE OR REPLACE VIEW commerce_events AS ${views.join(' UNION ALL ')}`)
  }
}

export const db = new CommerceDatabase()
