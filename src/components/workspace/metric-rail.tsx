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
    },
    {
      key: 'fees',
      label: 'Marketplace fees',
      amount: a.fees,
      hint: `${pct(a.feeRate)} of reported sales`,
    },
    {
      key: 'adjustments',
      label: 'Adjustments',
      amount: a.adjustments,
      hint: 'Credits, subsidies & other',
    },
    {
      key: 'settlement',
      label: 'Commerce settlement',
      amount: a.settlement,
      hint: 'Before product costs · excludes payouts',
    },
  ] as const

  return (
    <div className="metric-rail" aria-label="Settlement components by marketplace">
      {metrics.map((metric) => (
        <section
          key={metric.key}
          className={cn('metric-cell', metric.key === 'settlement' && 'metric-result')}
        >
          <div className="metric-label">
            <span>{metric.label}</span>
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
        </section>
      ))}
    </div>
  )
}
