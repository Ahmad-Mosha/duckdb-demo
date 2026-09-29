'use client'

import { useRef, useState } from 'react'
import {
  Activity,
  ArrowUpFromLine,
  ChartNoAxesCombined,
  ChevronDown,
  CircleAlert,
  Code2,
  Database,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Package,
  RotateCcw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCommerceWorkspace } from '@/hooks/use-commerce-workspace'
import type { Scope, Source } from '@/lib/commerce/types'
import { count } from '@/lib/format'
import { OverviewView } from './overview-view'
import { ProductsView } from './products-view'
import { ActivityView } from './activity-view'
import { SqlWorkspace } from './sql-workspace'
import { WorkspaceLoading } from './primitives'

const views = [
  { id: 'overview', name: 'Overview', icon: ChartNoAxesCombined },
  { id: 'products', name: 'Products', icon: Package },
  { id: 'activity', name: 'Activity', icon: Activity },
  { id: 'sql', name: 'SQL workspace', icon: Code2 },
]

export default function CommerceWorkspace() {
  const workspace = useCommerceWorkspace()
  const { data, busy, error, scope } = workspace
  const [view, setView] = useState('overview')
  const fileInput = useRef<HTMLInputElement>(null)
  const importSource = useRef<Source>('Amazon')
  function chooseFile(source: Source) {
    importSource.current = source
    fileInput.current?.click()
  }
  return (
    <TooltipProvider delayDuration={250}>
      <div className="app-shell">
        <header className="app-bar">
          <div className="flex items-center gap-3">
            <div className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="text-[18px] font-semibold tracking-[-0.03em]">
              commerce<span className="text-neutral-400">/</span>lab
            </span>
            <span className="mx-2 h-4 w-px bg-neutral-800" />
            <span className="hidden text-[13px] text-muted-foreground sm:inline">
              Local workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="rounded-sm border-neutral-700/70 px-2 font-mono text-[11px] font-normal tracking-wide text-neutral-400"
            >
              {data?.mode === 'Private' ? 'PRIVATE SESSION' : 'SYNTHETIC DEMO'}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Restore synthetic demo"
                  onClick={workspace.loadDemo}
                  disabled={!!busy}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Restore synthetic reports</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2 rounded-sm px-3" disabled={!!busy}>
                  <ArrowUpFromLine className="size-4" />
                  Import report
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-sm">
                <DropdownMenuLabel>Choose report source</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => chooseFile('Amazon')}
                  className="flex-col items-start gap-1 py-2.5"
                >
                  <span>Amazon</span>
                  <span className="text-[12px] text-muted-foreground">
                    Transaction CSV · 8-line preamble
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => chooseFile('Noon')}
                  className="flex-col items-start gap-1 py-2.5"
                >
                  <span>Noon</span>
                  <span className="text-[12px] text-muted-foreground">
                    Item-level finance report CSV
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <p className="px-2 py-1.5 text-[12px] text-muted-foreground">
                  Files are processed on this device.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              hidden
              aria-label="Commerce report file"
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0]
                if (file) await workspace.importFile(importSource.current, file)
                if (fileInput.current) fileInput.current.value = ''
              }}
            />
          </div>
        </header>
        <Tabs value={view} onValueChange={setView} className="gap-0">
          <div className="workspace-toolbar">
            <TabsList variant="line" className="workspace-tabs">
              <>
                {views.map((item) => (
                  <TabsTrigger key={item.id} value={item.id} className="workspace-tab">
                    <item.icon className="size-4" />
                    {item.name}
                  </TabsTrigger>
                ))}
              </>
            </TabsList>
            <div className="flex items-center gap-4">
              <span className="hidden items-center gap-1.5 font-mono text-[12px] text-neutral-400 xl:flex">
                <Database className="size-3" />
                {data ? `${count(data.analytics.rows)} events` : 'initializing'}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-sm border-neutral-800 bg-transparent text-[13px] font-normal"
                    disabled={!!busy || view === 'sql'}
                  >
                    <Layers3 className="size-4" />
                    {view === 'sql'
                      ? 'All loaded tables'
                      : scope === 'All'
                        ? 'All marketplaces'
                        : scope}
                    <ChevronDown className="size-3.5 text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-sm">
                  <DropdownMenuLabel>Analysis scope</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={scope}
                    onValueChange={(value) => workspace.setScope(value as Scope)}
                  >
                    <DropdownMenuRadioItem value="All">All marketplaces</DropdownMenuRadioItem>
                    {(['Amazon', 'Noon'] as Source[]).map((source) => (
                      <DropdownMenuRadioItem
                        key={source}
                        value={source}
                        disabled={!data?.sources.includes(source)}
                      >
                        {source}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="mx-7 mt-5 flex items-center gap-3 border border-neutral-600 bg-neutral-900 px-4 py-3 text-sm"
            >
              <CircleAlert className="size-4 shrink-0" />
              <p className="flex-1">{error}</p>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss error"
                onClick={workspace.dismissError}
              >
                <X className="size-3" />
              </Button>
            </div>
          )}
          {!data ? (
            <WorkspaceLoading
              message={busy || 'Unable to load the workspace. Restore the demo to retry.'}
            />
          ) : (
            <main aria-busy={!!busy}>
              <TabsContent value="overview" className="m-0">
                <OverviewView data={data} />
              </TabsContent>
              <TabsContent value="products" className="m-0">
                <ProductsView data={data} />
              </TabsContent>
              <TabsContent value="activity" className="m-0">
                <ActivityView data={data} />
              </TabsContent>
              <TabsContent value="sql" forceMount className="m-0 data-[state=inactive]:hidden">
                <SqlWorkspace key={workspace.revision} schema={data.schema} />
              </TabsContent>
            </main>
          )}
        </Tabs>
        <div className="engine-status">
          <span className="flex items-center gap-2">
            {busy ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <span className="size-1 rounded-full bg-neutral-500" />
            )}
            {busy || 'DuckDB · in memory'}
            {data && !busy && (
              <span className="ml-2 text-neutral-400">
                {data.elapsedMs.toFixed(1)} ms / analysis
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="size-3" />
            Device only<span className="mx-2 text-neutral-700">/</span>No uploads
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
