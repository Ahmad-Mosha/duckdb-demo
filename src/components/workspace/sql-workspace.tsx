'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Braces,
  ChevronDown,
  CircleAlert,
  Clock3,
  Database,
  Play,
  RotateCcw,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { executeQuery } from '@/lib/commerce/session'
import { defaultQuery } from '@/lib/commerce/queries'
import type { QueryResult, SchemaRow } from '@/lib/commerce/types'
import { DataTable } from './data-table'
import { EmptyState } from './primitives'
import { SqlEditor } from './sql-editor'

export function SqlWorkspace({ schema }: { schema: SchemaRow[] }) {
  const [sql, setSql] = useState(defaultQuery)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const inFlight = useRef(false)
  const run = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setRunning(true)
    setError('')
    setResult(null)
    try {
      setResult(await executeQuery(sql))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(false)
      inFlight.current = false
    }
  }, [sql])
  const tables = [...new Set(schema.map((column) => column.table_name))]
  return (
    <div className="sql-workspace">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="26%" minSize="260px" maxSize="40%">
          <aside className="h-full overflow-auto bg-[#0d0d0d]">
            <div className="pane-heading">
              <span className="flex items-center gap-2">
                <Database className="size-3.5" />
                Catalog
              </span>
              <span className="font-mono text-[12px] text-neutral-400">
                {tables.length} relations
              </span>
            </div>
            <div className="px-3 py-3">
              {tables.map((table) => (
                <details open={table === 'commerce_events'} key={table} className="group mb-2">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm px-2 py-2 text-sm text-neutral-200 hover:bg-neutral-900">
                    <ChevronDown className="size-3 transition-transform group-not-open:-rotate-90" />
                    {table === 'commerce_events' ? (
                      <Braces className="size-3.5 text-neutral-400" />
                    ) : (
                      <Table2 className="size-3.5 text-neutral-400" />
                    )}
                    <span className="font-mono text-[13px] font-medium">{table}</span>
                  </summary>
                  <div className="ml-4 border-l border-border py-1">
                    {schema
                      .filter((column) => column.table_name === table)
                      .map((column) => (
                        <div
                          key={column.column_name}
                          className="flex min-w-0 justify-between gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.025]"
                        >
                          <span
                            className="truncate font-mono text-neutral-400"
                            title={column.column_name}
                          >
                            {column.column_name}
                          </span>
                          <span className="shrink-0 font-mono text-neutral-400">
                            {column.data_type}
                          </span>
                        </div>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </aside>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize="50%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="49%" minSize="220px">
              <section className="flex h-full flex-col">
                <div className="pane-heading">
                  <span className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-neutral-500" />
                    <span className="font-mono text-[13px]">exploration.sql</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="mr-2 hidden text-[12px] text-neutral-400 lg:block">
                      Read-only
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Reset SQL query"
                          onClick={() => setSql(defaultQuery)}
                        >
                          <RotateCcw className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset example query</TooltipContent>
                    </Tooltip>
                    <Button
                      size="sm"
                      className="gap-2 rounded-sm px-3"
                      disabled={running}
                      onClick={run}
                    >
                      <Play className="size-3" fill="currentColor" />
                      {running ? 'Running…' : 'Run query'}
                      <kbd className="ml-3 font-mono text-[12px] opacity-50">⌘ ↵</kbd>
                    </Button>
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <SqlEditor value={sql} onChange={setSql} onRun={run} />
                </div>
              </section>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel minSize="180px">
              <section className="h-full overflow-auto">
                <div className="pane-heading">
                  <span>Query results</span>
                  {result ? (
                    <span className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
                      <span>{result.rows.length} rows</span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {result.elapsedMs.toFixed(1)} ms
                      </span>
                    </span>
                  ) : (
                    <span className="font-mono text-[12px] text-neutral-400">200 ROW PREVIEW</span>
                  )}
                </div>
                {error ? (
                  <div
                    role="alert"
                    className="m-5 flex gap-3 border border-neutral-700 bg-neutral-900 p-4"
                  >
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="mb-2 text-sm font-medium">Query could not run</p>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-muted-foreground">
                        {error}
                      </pre>
                    </div>
                  </div>
                ) : result ? (
                  <DataTable
                    rows={result.rows}
                    columns={result.columns.map((key) => ({
                      key,
                      title: key,
                      numeric: typeof result.rows[0]?.[key] === 'number',
                    }))}
                    maxHeight={700}
                  />
                ) : (
                  <EmptyState
                    title={running ? 'Executing in DuckDB…' : 'Ready for a query'}
                    detail="Explore commerce_events or inspect the original report tables. Run with ⌘ / Ctrl + Enter."
                  />
                )}
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
