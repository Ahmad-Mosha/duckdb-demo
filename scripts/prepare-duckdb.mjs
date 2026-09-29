import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const distribution = dirname(require.resolve('@duckdb/duckdb-wasm'))
const target = new URL('../public/duckdb/', import.meta.url)
await mkdir(target, { recursive: true })
for (const file of [
  'duckdb-mvp.wasm',
  'duckdb-eh.wasm',
  'duckdb-browser-mvp.worker.js',
  'duckdb-browser-eh.worker.js',
]) {
  await copyFile(join(distribution, file), new URL(file, target))
}
