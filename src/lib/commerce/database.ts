import { tableFromArrays } from 'apache-arrow'
import { getConnection, query } from '@/lib/duckdb/runtime'
import { normalizationSQL, parseReport, rawTable } from './adapters'
import type { ReportInput, Source } from './types'

let loaded: Source[] = []
let sequence = 0
export const getSources = () => [...loaded]

export async function replaceReports(reports: ReportInput[], reset: boolean) {
  // Parse everything before touching the current database.
  const parsed = reports.map((report) => ({
    source: report.source,
    table: tableFromArrays(parseReport(report.source, report.data)),
  }))
  const connection = await getConnection()
  const stages: { source: Source; name: string }[] = []
  const nextSources = [
    ...new Set([...(reset ? [] : loaded), ...reports.map((report) => report.source)]),
  ]
  try {
    for (const report of parsed) {
      const stage = { source: report.source, name: `report_import_${++sequence}` }
      stages.push(stage)
      await connection.insertArrowTable(report.table, { name: stage.name, schema: 'main' })
    }
    await query('BEGIN TRANSACTION')
    try {
      await query('DROP VIEW IF EXISTS commerce_events')
      for (const stage of stages)
        await query(
          `CREATE OR REPLACE TABLE ${rawTable(stage.source)} AS SELECT * FROM ${stage.name}`,
        )
      for (const source of loaded)
        if (!nextSources.includes(source)) await query(`DROP TABLE IF EXISTS ${rawTable(source)}`)
      await query(normalizationSQL(nextSources))
      // Bind the view now so invalid column layouts roll back before replacing the session.
      await query('SELECT * FROM commerce_events LIMIT 0')
      await query('COMMIT')
      loaded = nextSources
    } catch (error) {
      await query('ROLLBACK')
      throw error
    }
  } finally {
    for (const stage of stages) await query(`DROP TABLE IF EXISTS ${stage.name}`)
  }
}
