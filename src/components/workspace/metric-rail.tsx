import { ArrowRight, Equal } from 'lucide-react'
import type { Analytics } from '@/lib/commerce/analytics'
import { money, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MetricRail({ analytics: a }: { analytics: Analytics }) {
  const metrics = [
    {
      key: 'sales',
      label: 'Reported sales',
      amount: a.sales,
      hint: 'Source-defined sales',
      symbol: ArrowRight,
    },
    {
      key: 'fees',
      label: 'Marketplace fees',
      amount: a.fees,
      hint: `${pct(a.feeRate)} of reported sales`,
      symbol: ArrowRight,
    },
    {
      key: 'adjustments',
      label: 'Adjustments',
      amount: a.adjustments,
      hint: 'Credits, subsidies & other',
      symbol: ArrowRight,
    },
    {
      key: 'settlement',
      label: 'Commerce settlement',
      amount: a.settlement,
      hint: 'Before product costs · excludes payouts',
      symbol: Equal,
    },
  ] as const

  return (
    <div className="metric-rail" aria-label="Settlement components by marketplace">
      {metrics.map((metric, index) => (
        <section
          key={metric.key}
          className={cn('metric-cell', metric.key === 'settlement' && 'metric-result')}
        >
          <div className="metric-label">
            <span>{metric.label}</span>
            <span className="metric-step" aria-hidden="true">
              0{index + 1}
            </span>
          </div>
          <div className="metric-amount">
            <span className="sr-only">{money(metric.amount)}</span>
            <span aria-hidden="true">
              {money(metric.amount).split('.')[0]}
              <span className="metric-decimals">.{money(metric.amount).split('.')[1]}</span>
            </span>
          </div>
          <p className="metric-hint">{metric.hint}</p>
          <div className="metric-breakdown" aria-label={`${metric.label} by source`}>
            {a.metricSources[metric.key].map((row) => (
              <div className="metric-source" key={row.source}>
                <span className="metric-source-name">{row.source}</span>
                <span className="metric-source-value">{money(row.amount)}</span>
                <span className="metric-track" aria-hidden="true">
                  <span
                    className={row.source === 'Noon' ? 'metric-bar secondary' : 'metric-bar'}
                    style={{ width: `${row.width}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
          {index > 0 && (
            <span className="metric-operator" aria-hidden="true">
              <metric.symbol className="size-3" />
            </span>
          )}
        </section>
      ))}
    </div>
  )
}
