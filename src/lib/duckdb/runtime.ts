import * as duckdb from '@duckdb/duckdb-wasm'
import type { Row } from '@/lib/commerce/types'

const bundles: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: '/duckdb/duckdb-mvp.wasm',
    mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
  },
  eh: { mainModule: '/duckdb/duckdb-eh.wasm', mainWorker: '/duckdb/duckdb-browser-eh.worker.js' },
}

let connectionPromise: Promise<duckdb.AsyncDuckDBConnection> | undefined

async function connect() {
  const bundle = await duckdb.selectBundle(bundles)
  const worker = new Worker(bundle.mainWorker!)
  const database = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker)
  try {
    await database.instantiate(bundle.mainModule, bundle.pthreadWorker)
    return await database.connect()
  } catch (error) {
    worker.terminate()
    throw error
  }
}

/** A single browser connection, including React Strict Mode's repeated mounts. */
export function getConnection() {
  connectionPromise ??= connect().catch((error) => {
    connectionPromise = undefined
    throw error
  })
  return connectionPromise
}

export async function query<T extends Row = Row>(sql: string): Promise<T[]> {
  const connection = await getConnection()
  const table = await connection.query(sql)
  return table.toArray().map((row) => row.toJSON() as T)
}

export async function queryWithColumns(sql: string) {
  const connection = await getConnection()
  const table = await connection.query(sql)
  return {
    rows: table.toArray().map((row) => row.toJSON() as Row),
    columns: table.schema.fields.map((field) => field.name),
  }
}
