import { ScanLine } from 'lucide-react'
import type { WorkspaceData } from '@/lib/commerce/session'
import { money, pct, count, shortDate, fullDate } from '@/lib/format'
import { DataTable } from './data-table'
import { DailySalesChart, MarketplaceChart, SourceLegend, SettlementBridgeChart } from './charts'
import { MetricRail } from './metric-rail'
import { Panel, SourceMark, TechnicalBadge, ViewHeading } from './primitives'

export function OverviewView({ data }: { data: WorkspaceData }) {
  const { snapshot, analytics: a } = data
  return (
    <div className="workspace-content">
      <ViewHeading
        title="Settlement overview"
        description="Follow the money across your marketplace reports."
        aside={
          <TechnicalBadge>
            {fullDate(a.firstDay)} — {fullDate(a.lastDay)}
            <span className="ml-1 text-neutral-400">/ report dates</span>
          </TechnicalBadge>
        }
      />
      <MetricRail analytics={a} />
      <div className="analysis-grid">
        <Panel
          title="Sales activity"
          description="Source-defined sales by recorded event date. Lines connect recorded dates; missing source dates are not treated as zero."
          aside={<SourceLegend sources={data.snapshot.summary.map((row) => row.marketplace)} />}
        >
          <DailySalesChart data={a.days} />
          <div className="panel-caption">
            <span>{a.days.length} recorded dates</span>
            <span>Hover to inspect daily values</span>
          </div>
        </Panel>
        <Panel
          title="Settlement bridge"
          description="Signed sales, fees and adjustments lead to the reported commerce settlement. The final bar uses reported totals; reconciliation checks identify any mismatch."
        >
          <SettlementBridgeChart data={a.bridge} />
          <div className="mx-5 mb-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-neutral-400">Commerce settlement</span>
            <span className="font-mono text-xl tracking-tight">{money(a.settlement)}</span>
          </div>
          <p className="px-5 pb-4 text-[12px] leading-relaxed text-neutral-400">
            Excludes {money(a.payouts)} in payout transfers. Settlement does not include product
            cost.
          </p>
        </Panel>
      </div>
      <div className="analysis-grid comparison-grid">
        <Panel
          title="Marketplace comparison"
          description="Amazon product sales and Noon net proceeds have different definitions. Compare directionally and check each source's date range."
          aside={
            <div className="flex gap-3">
              <span>■ Sales</span>
              <span className="text-neutral-400">■ Settlement</span>
            </div>
          }
        >
          <MarketplaceChart data={snapshot.summary} />
          <DataTable
            rows={snapshot.summary}
            columns={[
              {
                key: 'marketplace',
                title: 'Marketplace',
                cell: (row) => <SourceMark source={row.marketplace} />,
              },
              { key: 'rows', title: 'Events', numeric: true },
              { key: 'sales', title: 'Sales', numeric: true, cell: (row) => money(row.sales) },
              { key: 'fees', title: 'Fees', numeric: true, cell: (row) => money(row.fees) },
              {
                key: 'commerce_settlement',
                title: 'Settlement',
                numeric: true,
                cell: (row) => money(row.commerce_settlement),
              },
            ]}
          />
          <div className="panel-caption flex-wrap">
            {snapshot.summary.map((row) => (
              <span key={row.marketplace}>
                {row.marketplace} · {shortDate(row.first_day ?? undefined)}–
                {shortDate(row.last_day ?? undefined)}
              </span>
            ))}
            {a.periodsDiffer && <span className="text-neutral-300">Different report periods</span>}
          </div>
        </Panel>
        <Panel title="Report signals" aside={<ScanLine className="size-3.5" />}>
          <div className="divide-y divide-border px-5">
            <div className="signal-row">
              <div>
                <p className="signal-label">Sales concentration</p>
                <p className="signal-detail">Top {a.topCount} SKUs · positive net sales</p>
              </div>
              <strong>{pct(a.topThree)}</strong>
            </div>
            <div className="signal-row">
              <div>
                <p className="signal-label">Highest fee pressure</p>
                <p className="signal-detail">
                  {a.highFee
                    ? `${a.highFee.sku} · ${a.highFee.marketplace}`
                    : 'No positive-sales products'}
                </p>
              </div>
              <strong>{a.highFee ? pct(a.highFee.fee_rate ?? 0) : '—'}</strong>
            </div>
            <div className="signal-row">
              <div>
                <p className="signal-label">Reconciliation</p>
                <p className="signal-detail">Rows outside rounding tolerance</p>
              </div>
              <strong>{count(a.unmatched)}</strong>
            </div>
          </div>
          <p className="px-5 py-4 text-[12px] leading-relaxed text-neutral-400">
            Deterministic observations from the loaded reports.
          </p>
        </Panel>
      </div>
    </div>
  )
}
