import { Check, Minus } from 'lucide-react'
import type { WorkspaceData } from '@/lib/commerce/session'
import { money } from '@/lib/format'
import { DailySalesChart, SourceLegend } from './charts'
import { DataTable } from './data-table'
import { Panel, SourceMark, TechnicalBadge, ViewHeading } from './primitives'

export function ActivityView({ data }: { data: WorkspaceData }) {
  return (
    <div className="workspace-content">
      <ViewHeading
        title="Transaction activity"
        description="Trace the daily series and inspect the source-native events behind it."
        aside={<TechnicalBadge>{data.analytics.days.length} recorded dates</TechnicalBadge>}
      />
      <Panel
        title="Daily reported sales"
        aside={<SourceLegend sources={data.snapshot.summary.map((row) => row.marketplace)} />}
      >
        <DailySalesChart data={data.analytics.days} height={290} />
        <div className="panel-caption">
          <span>Payout transfers excluded</span>
          <span>Missing source dates are not counted as zero</span>
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel
          title="Event types"
          description="Source-native transaction labels are retained. Signed refunds and updates remain in the analytical model."
        >
          <DataTable
            rows={data.snapshot.events}
            columns={[
              {
                key: 'marketplace',
                title: 'Source',
                cell: (row) => <SourceMark source={row.marketplace} />,
              },
              {
                key: 'event_type',
                title: 'Transaction type',
                cell: (row) => <code className="text-[13px]">{row.event_type}</code>,
              },
              { key: 'rows', title: 'Rows', numeric: true },
              {
                key: 'settlement',
                title: 'Reported total',
                numeric: true,
                cell: (row) => money(row.settlement),
              },
            ]}
          />
        </Panel>
        <Panel
          title="Data checks"
          description="Reconciliation checks sales + fees + other against the reported total with a 0.02 tolerance."
        >
          <div className="px-5">
            {data.snapshot.quality.map((row) => (
              <div key={row.marketplace} className="border-b border-border py-4 last:border-0">
                <div className="mb-4 flex justify-between text-sm">
                  <SourceMark source={row.marketplace} />
                  <span className="font-mono text-[12px] text-neutral-400">{row.rows} rows</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { title: 'Missing dates', amount: row.missing_dates },
                    { title: 'Without SKU', amount: row.missing_skus },
                    { title: 'Unreconciled', amount: row.unreconciled_rows },
                  ].map((check) => (
                    <div key={check.title}>
                      <span className="flex items-center gap-1.5 font-mono text-base">
                        {check.amount === 0 ? (
                          <Check className="size-3 text-neutral-400" />
                        ) : (
                          <Minus className="size-3 text-neutral-400" />
                        )}
                        {check.amount}
                      </span>
                      <span className="mt-1 block text-[12px] text-muted-foreground">
                        {check.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-border px-5 py-3 text-[12px] leading-relaxed text-muted-foreground">
            Source-level fees and adjustments can legitimately lack a SKU. These counts are
            diagnostic.
          </p>
        </Panel>
      </div>
    </div>
  )
}
