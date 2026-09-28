import { getConnection, queryWithColumns } from '@/lib/duckdb/runtime'
import { replaceReports, getSources } from './database'
import { deriveAnalytics, getSchema, getSnapshot } from './analytics'
import { readOnlyQuery } from './queries'
import type { QueryResult, Scope, SessionMode, Source } from './types'

let mode: SessionMode = 'Demo'
let initialization: Promise<void> | undefined

export function initializeSession() {
  initialization ??= getConnection()
    .then(() => restoreDemo())
    .catch((error) => {
      initialization = undefined
      throw error
    })
  return initialization
}
export async function restoreDemo() {
  const reports = await Promise.all(
    (['Amazon', 'Noon'] as Source[]).map(async (source) => {
      const response = await fetch(`/demo/${source.toLowerCase()}.csv`)
      if (!response.ok) throw new Error(`Could not load the ${source} demo report.`)
      return { source, data: new Uint8Array(await response.arrayBuffer()) }
    }),
  )
  await replaceReports(reports, true)
  mode = 'Demo'
}
export async function importReport(source: Source, data: Uint8Array) {
  await replaceReports([{ source, data }], mode === 'Demo')
  mode = 'Private'
}
export async function readWorkspace(scope: Scope) {
  const start = performance.now()
  const [snapshot, schema] = await Promise.all([getSnapshot(scope), getSchema()])
  return {
    snapshot,
    schema,
    analytics: deriveAnalytics(snapshot),
    sources: getSources(),
    mode,
    elapsedMs: performance.now() - start,
  }
}
export type WorkspaceData = Awaited<ReturnType<typeof readWorkspace>>
export async function executeQuery(input: string): Promise<QueryResult> {
  const sql = readOnlyQuery(input)
  const start = performance.now()
  const result = await queryWithColumns(sql)
  return { ...result, elapsedMs: performance.now() - start }
}
