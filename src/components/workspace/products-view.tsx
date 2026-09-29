'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { filterProducts, feeProducts } from '@/lib/commerce/analytics'
import type { WorkspaceData } from '@/lib/commerce/session'
import { money, pct } from '@/lib/format'
import { DataTable } from './data-table'
import { FeePressureChart } from './charts'
import { EmptyState, Panel, SourceMark, TechnicalBadge, ViewHeading } from './primitives'

export function ProductsView({ data }: { data: WorkspaceData }) {
  const [search, setSearch] = useState('')
  const products = filterProducts(data.snapshot.products, search)
  const feeRows = feeProducts(products)
  return (
    <div className="workspace-content notebook-content products-content">
      <ViewHeading
        title="Product analysis"
        description="Find concentration, compare fee pressure, and inspect every SKU."
        aside={
          <TechnicalBadge>{data.snapshot.products.length} SKU × marketplace rows</TechnicalBadge>
        }
      />
      <div className="product-workbench">
        <Panel
          title="SKU ledger"
          className="product-ledger notebook-section"
          index="01"
          subtitle="Inspect source totals for every SKU. Filter by SKU or sort any column."
          aside={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-neutral-400" />
              <Input
                aria-label="Filter SKUs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter SKU…"
                className="h-9 w-52 rounded-sm border-neutral-700/70 pl-8 text-[13px]"
              />
            </div>
          }
        >
          <DataTable
            rows={products}
            sortKey="sales"
            maxHeight={720}
            columns={[
              {
                key: 'sku',
                title: 'SKU',
                cell: (row) => <code className="text-[13px] text-white">{row.sku}</code>,
              },
              {
                key: 'marketplace',
                title: 'Source',
                cell: (row) => <SourceMark source={row.marketplace} />,
              },
              { key: 'rows', title: 'Events', numeric: true },
              { key: 'sales', title: 'Sales', numeric: true, cell: (row) => money(row.sales) },
              { key: 'fees', title: 'Fees', numeric: true, cell: (row) => money(row.fees) },
              {
                key: 'fee_rate',
                title: 'Fee / sales',
                numeric: true,
                cell: (row) => (row.fee_rate == null ? '—' : pct(row.fee_rate)),
              },
              {
                key: 'settlement',
                title: 'Settlement',
                numeric: true,
                cell: (row) => money(row.settlement),
              },
            ]}
          />
          <div className="panel-caption">
            <span>{products.length} matching rows</span>
            <span>Click column headers to sort</span>
          </div>
        </Panel>
        <div className="product-inspector">
          <Panel
            title="Fee pressure"
            className="notebook-section"
            index="02"
            subtitle="Sales volume vs. the share absorbed by fees."
            description="Each point is a SKU and marketplace. Vertical position is negated signed fees divided by positive sales; horizontal position is reported sales."
            aside={<span>{feeRows.length} plotted</span>}
          >
            <FeePressureChart data={feeRows} />
            <div className="panel-caption">
              <span>Higher = more sales absorbed by fees</span>
              <span>
                {data.snapshot.summary.map((row) => (
                  <span
                    key={row.marketplace}
                    className={row.marketplace === 'Noon' ? 'ml-2 text-neutral-400' : ''}
                  >
                    {row.marketplace === 'Amazon' ? '●' : '◆'} {row.marketplace}
                  </span>
                ))}
              </span>
            </div>
          </Panel>
          <Panel
            title="Sales concentration"
            className="notebook-section"
            index="03"
            subtitle="Cumulative share of positive net sales."
            description="Cumulative share of positive net sales by exact SKU. The ranking is calculated with a DuckDB window function."
            aside={<span className="whitespace-nowrap font-mono text-[12px]">Share %</span>}
          >
            <div className="px-5 py-3">
              {data.snapshot.concentration.length ? (
                data.snapshot.concentration.slice(0, 8).map((row) => (
                  <div key={row.sku} className="concentration-item">
                    <span className="font-mono text-[12px] text-neutral-400">
                      {String(row.rank).padStart(2, '0')}
                    </span>
                    <code className="text-[13px] text-neutral-300">{row.sku}</code>
                    <div className="h-1 bg-neutral-800">
                      <div
                        className="relative h-full bg-neutral-400 after:absolute after:-top-0.5 after:right-0 after:h-2 after:w-px after:bg-neutral-100"
                        style={{ width: `${row.cumulative_pct}%` }}
                      />
                    </div>
                    <span className="text-right font-mono text-[12px]">
                      {pct(row.cumulative_pct)}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No positive SKU sales"
                  detail="Concentration requires products with positive net reported sales."
                />
              )}
            </div>
            <div className="panel-caption">
              <span>Returns are included in each SKU’s net sales</span>
              <span>All SKUs in source scope</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
