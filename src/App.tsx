import { useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Database,
  FileUp,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Table2,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { useCommerceWorkspace } from '@/hooks/use-commerce-workspace'
import { executeQuery } from '@/lib/commerce/session'
import { defaultQuery as sampleSQL } from '@/lib/commerce/queries'
import { filterProducts, feeProducts } from '@/lib/commerce/analytics'
import type { Row, Source } from '@/lib/commerce/types'
import { money, pct, label, value } from '@/lib/format'

type Tab = 'Overview' | 'Products' | 'Activity' | 'SQL'

const chartInk = '#eceeef'
const chartMuted = '#8d9296'
const chartGrid = '#303337'
const tooltipStyle = {
  background: '#181a1d',
  border: '1px solid #393d41',
  borderRadius: 2,
  color: '#eceeef',
  fontSize: 11,
}

function Metric({
  label: title,
  amount,
  hint,
  tone,
}: {
  label: string
  amount: string
  hint?: string
  tone?: 'strong' | 'subtle'
}) {
  return (
    <div className="metric">
      <div className="metric-label">{title}</div>
      <div className={`metric-value ${tone ?? ''}`}>{amount}</div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string
  title: string
  aside?: string
}) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {aside && <span className="section-aside">{aside}</span>}
    </div>
  )
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <Database size={27} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}

function DataTable({
  rows,
  columns,
  sortKey,
}: {
  rows: Row[]
  columns: {
    key: string
    title: string
    render?: (row: Row) => React.ReactNode
    numeric?: boolean
  }[]
  sortKey?: string
}) {
  const [sort, setSort] = useState(sortKey ?? '')
  const [desc, setDesc] = useState(true)
  const sorted = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => {
      const av = a[sort],
        bv = b[sort]
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''))
      return desc ? -cmp : cmp
    })
  }, [rows, sort, desc])
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.numeric ? 'num' : ''}>
                <button
                  onClick={() => {
                    if (sort === col.key) setDesc(!desc)
                    else {
                      setSort(col.key)
                      setDesc(true)
                    }
                  }}
                >
                  {col.title}
                  {sort === col.key && <ChevronDown size={12} className={desc ? '' : 'flip'} />}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!sorted.length && (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                No matching rows.
              </td>
            </tr>
          )}
          {sorted.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key} className={col.numeric ? 'num' : ''}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const workspace = useCommerceWorkspace()
  const { data, scope, setScope, busy, error } = workspace
  const [tab, setTab] = useState<Tab>('Overview')
  const [productSearch, setProductSearch] = useState('')
  const [sql, setSql] = useState(sampleSQL)
  const [sqlRows, setSqlRows] = useState<Row[]>([])
  const [sqlMs, setSqlMs] = useState<number | null>(null)
  const [sqlError, setSqlError] = useState('')
  const amazonInput = useRef<HTMLInputElement>(null)
  const noonInput = useRef<HTMLInputElement>(null)
  const snapshot = data?.snapshot ?? null
  const schema = data?.schema ?? []
  const sources = data?.sources ?? []
  const mode = data?.mode ?? 'Demo'
  const ready = !!data
  const analytics = data?.analytics
  const summary = snapshot?.summary ?? []
  const feeRate = analytics?.feeRate ?? 0
  const totalRows = analytics?.rows ?? 0
  const productRows = filterProducts(snapshot?.products ?? [], productSearch)
  const feeRows = feeProducts(productRows)
  const concentration = snapshot?.concentration ?? []
  const topThree = analytics?.topThree ?? 0
  const highFee = analytics?.highFee
  const coverage = analytics?.coverage ?? ''
  const periodsDiffer = analytics?.periodsDiffer ?? false
  const days = analytics?.days ?? []

  function clearResults() {
    setSqlRows([])
    setSqlMs(null)
    setSqlError('')
  }
  async function loadDemo() {
    await workspace.loadDemo()
    clearResults()
  }
  async function importFile(source: Source, file?: File) {
    if (!file) return
    await workspace.importFile(source, file)
    clearResults()
    if (amazonInput.current) amazonInput.current.value = ''
    if (noonInput.current) noonInput.current.value = ''
  }
  async function runSQL() {
    clearResults()
    try {
      const result = await executeQuery(sql)
      setSqlRows(result.rows)
      setSqlMs(result.elapsedMs)
    } catch (error) {
      setSqlError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="workbench">
      <div className="chrome">
        <div className="identity">
          <span className="identity-glyph">∷</span>
          <span>
            COMMERCE<span className="identity-slash">/</span>LAB
          </span>
          <span className="identity-edition">DATA WORKBENCH</span>
        </div>
        <div className="chrome-state">
          <span className="state-pulse" />
          {busy || (ready ? 'DUCKDB / READY' : 'INITIALIZING')}
          <span className="state-divider" />
          <ShieldCheck size={13} />
          <span>LOCAL ONLY</span>
        </div>
      </div>
      <div className="commandbar">
        <nav className="work-tabs" aria-label="Analysis views">
          {(['Overview', 'Products', 'Activity', 'SQL'] as Tab[]).map((item, index) => (
            <button
              key={item}
              className={`work-tab ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item === 'SQL' ? 'SQL console' : item}
            </button>
          ))}
        </nav>
        <div className="command-actions">
          <button
            className="command-button"
            onClick={() => amazonInput.current?.click()}
            disabled={!ready || !!busy}
          >
            <FileUp size={14} /> AMAZON CSV
          </button>
          <button
            className="command-button"
            onClick={() => noonInput.current?.click()}
            disabled={!ready || !!busy}
          >
            <FileUp size={14} /> NOON CSV
          </button>
          <button
            className="reset-button"
            title="Restore synthetic demo"
            aria-label="Restore synthetic demo"
            onClick={loadDemo}
          >
            <RotateCcw size={14} />
          </button>
          <input
            ref={amazonInput}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => importFile('Amazon', e.target.files?.[0])}
          />
          <input
            ref={noonInput}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => importFile('Noon', e.target.files?.[0])}
          />
        </div>
      </div>
      <main className="main">
        <div className="view-heading">
          <div className="view-title">
            <div className="view-kicker">
              ANALYSIS / {tab.toUpperCase()} <span>—</span>{' '}
              {mode === 'Demo' ? 'SYNTHETIC DATA' : 'PRIVATE SESSION'}
            </div>
            <h1>
              {tab === 'SQL'
                ? 'Query workbench'
                : tab === 'Overview'
                  ? 'The commerce ledger'
                  : tab === 'Products'
                    ? 'Product signals'
                    : 'Transaction activity'}
            </h1>
            <p>
              {tab === 'Overview'
                ? 'Source-defined sales, fees, adjustments, and settlement in one place.'
                : tab === 'Products'
                  ? 'Follow revenue concentration and fee pressure down to the SKU.'
                  : tab === 'Activity'
                    ? 'Watch the dates, inspect event types, and check the arithmetic.'
                    : 'Work directly with normalized events and the original report tables.'}
            </p>
          </div>
          <div className="view-meta">
            <span>IN MEMORY / THIS TAB</span>
            <strong>
              {Math.round(totalRows).toLocaleString()} <small>ROWS</small>
            </strong>
          </div>
        </div>
        <div className="dataset-strip">
          <span className="strip-label">SOURCE SCOPE</span>
          <div className="scope-options">
            <button className={scope === 'All' ? 'selected' : ''} onClick={() => setScope('All')}>
              ALL <small>{sources.length}</small>
            </button>
            {(['Amazon', 'Noon'] as Source[]).map((source) => (
              <button
                key={source}
                className={scope === source ? 'selected' : ''}
                onClick={() => setScope(source)}
                disabled={!sources.includes(source)}
              >
                <i className={`source-dot ${source.toLowerCase()}`} />
                {source.toUpperCase()}
              </button>
            ))}
          </div>
          <span
            className="strip-catalog"
            onClick={() => setTab('SQL')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setTab('SQL')
            }}
          >
            <Table2 size={13} /> COMMERCE_EVENTS <span>+ {sources.length} RAW</span>
          </span>
        </div>
        {error && (
          <div className="alert">
            <CircleAlert size={16} />
            {error}
            <button onClick={workspace.dismissError}>Dismiss</button>
          </div>
        )}
        {!snapshot ? (
          <Empty
            title={busy || 'No data loaded'}
            detail="DuckDB is preparing your local analytical workspace."
          />
        ) : (
          <>
            {tab === 'Overview' && (
              <div className="content">
                <div className="coverage">
                  <span className="coverage-label">
                    <Timer size={14} /> REPORT COVERAGE
                  </span>
                  <span>{coverage || 'No dated events'}</span>
                  {periodsDiffer && (
                    <span className="coverage-note">
                      Compare periods before interpreting marketplace differences.
                    </span>
                  )}
                </div>
                <div className="metrics">
                  <Metric
                    label="REPORTED SALES"
                    amount={money(analytics?.sales ?? 0)}
                    hint="Amazon product sales · Noon net proceeds"
                  />
                  <Metric
                    label="MARKETPLACE FEES"
                    amount={money(analytics?.fees ?? 0)}
                    hint={`${pct(feeRate)} of reported sales`}
                    tone="subtle"
                  />
                  <Metric
                    label="OTHER ADJUSTMENTS"
                    amount={money(analytics?.adjustments ?? 0)}
                    hint="Credits, subsidies, and other lines"
                  />
                  <Metric
                    label="COMMERCE SETTLEMENT"
                    amount={money(analytics?.settlement ?? 0)}
                    hint="Excludes payout transfers"
                    tone="strong"
                  />
                </div>
                <div className="overview-grid">
                  <section className="panel bridge">
                    <SectionTitle
                      eyebrow="01 / MONEY FLOW"
                      title="Settlement bridge"
                      aside="Reported currency"
                    />
                    <div className="bridge-list">
                      <div>
                        <span>Reported sales</span>
                        <strong>{money(analytics?.sales ?? 0)}</strong>
                      </div>
                      <div>
                        <span>Marketplace fees</span>
                        <strong className="negative">{money(analytics?.fees ?? 0)}</strong>
                      </div>
                      <div>
                        <span>Credits & adjustments</span>
                        <strong>{money(analytics?.adjustments ?? 0)}</strong>
                      </div>
                      <div className="bridge-total">
                        <span>Commerce settlement</span>
                        <strong>{money(analytics?.settlement ?? 0)}</strong>
                      </div>
                    </div>
                    <p className="panel-footnote">
                      Payout transfers ({money(analytics?.payouts ?? 0)}) are excluded. Product
                      costs are not in these reports, so settlement is not profit.
                    </p>
                  </section>
                  <section className="panel comparison">
                    <SectionTitle
                      eyebrow="02 / SOURCES"
                      title="Marketplace comparison"
                      aside={`${summary.length} loaded`}
                    />
                    <div
                      className="comparison-chart"
                      aria-label="Sales and settlement by marketplace"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={summary}
                          layout="vertical"
                          barGap={5}
                          margin={{ top: 12, right: 18, bottom: 4, left: 0 }}
                        >
                          <CartesianGrid stroke={chartGrid} horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fill: chartMuted, fontSize: 10 }}
                            tickFormatter={(n: number) => money(n, true)}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="marketplace"
                            tick={{ fill: chartInk, fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={70}
                          />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(n, name) => [money(Number(n)), name]}
                            cursor={{ fill: '#24272a' }}
                          />
                          <Bar
                            dataKey="sales"
                            name="Reported sales"
                            fill={chartInk}
                            barSize={10}
                            isAnimationActive={false}
                          />
                          <Bar
                            dataKey="commerce_settlement"
                            name="Commerce settlement"
                            fill={chartMuted}
                            barSize={10}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-legend comparison-legend">
                      <span>
                        <i className="legend-key sales" /> Reported sales
                      </span>
                      <span>
                        <i className="legend-key settlement" /> Commerce settlement
                      </span>
                    </div>
                    <DataTable
                      rows={summary}
                      sortKey="sales"
                      columns={[
                        {
                          key: 'marketplace',
                          title: 'Source',
                          render: (r) => (
                            <span className="source-cell">
                              <i
                                className={`source-dot ${label(r, 'marketplace').toLowerCase()}`}
                              />
                              {label(r, 'marketplace')}
                            </span>
                          ),
                        },
                        {
                          key: 'sales',
                          title: 'Sales',
                          numeric: true,
                          render: (r) => money(value(r, 'sales')),
                        },
                        {
                          key: 'fees',
                          title: 'Fees',
                          numeric: true,
                          render: (r) => money(value(r, 'fees')),
                        },
                        {
                          key: 'commerce_settlement',
                          title: 'Settlement',
                          numeric: true,
                          render: (r) => money(value(r, 'commerce_settlement')),
                        },
                      ]}
                    />
                    <p className="panel-footnote">
                      “Sales” uses each source’s own field definition. Compare directionally; source
                      periods and accounting semantics may differ.
                    </p>
                  </section>
                </div>
                <section className="panel discoveries">
                  <SectionTitle
                    eyebrow="03 / SIGNALS"
                    title="Worth a closer look"
                    aside="Computed from loaded rows"
                  />
                  <div className="discovery-grid">
                    <div>
                      <TrendingUp size={17} />
                      <span>CONCENTRATION</span>
                      <strong>
                        Top {Math.min(3, concentration.length)} SKUs account for {pct(topThree)}
                      </strong>
                      <small>Share of positive reported sales across products.</small>
                    </div>
                    <div>
                      <ArrowUpRight size={17} />
                      <span>FEE PRESSURE</span>
                      <strong>
                        {highFee
                          ? `${label(highFee, 'sku')} · ${pct(value(highFee, 'fee_rate'))}`
                          : 'No SKU sales yet'}
                      </strong>
                      <small>Highest fee to sales ratio among positive-sales SKU rows.</small>
                    </div>
                    <div>
                      <CircleCheck size={17} />
                      <span>RECONCILIATION</span>
                      <strong>{analytics?.unmatched ?? 0} unmatched rows</strong>
                      <small>Checks sales + fees + other against reported total.</small>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {tab === 'Products' && (
              <div className="content">
                <div className="content-intro">
                  <span>{productRows.length} SKU × marketplace rows</span>
                  <label className="search">
                    <Search size={15} />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Filter SKU"
                    />
                  </label>
                </div>
                <section className="panel">
                  <SectionTitle
                    eyebrow="01 / PRODUCT PERFORMANCE"
                    title="SKU ledger"
                    aside="Click a column to sort"
                  />
                  <DataTable
                    rows={productRows}
                    sortKey="sales"
                    columns={[
                      {
                        key: 'sku',
                        title: 'SKU',
                        render: (r) => <code className="sku">{label(r, 'sku')}</code>,
                      },
                      {
                        key: 'marketplace',
                        title: 'Source',
                        render: (r) => (
                          <span className="source-cell">
                            <i className={`source-dot ${label(r, 'marketplace').toLowerCase()}`} />
                            {label(r, 'marketplace')}
                          </span>
                        ),
                      },
                      { key: 'rows', title: 'Events', numeric: true },
                      {
                        key: 'sales',
                        title: 'Sales',
                        numeric: true,
                        render: (r) => money(value(r, 'sales')),
                      },
                      {
                        key: 'fees',
                        title: 'Fees',
                        numeric: true,
                        render: (r) => <span className="negative">{money(value(r, 'fees'))}</span>,
                      },
                      {
                        key: 'fee_rate',
                        title: 'Fee / sales',
                        numeric: true,
                        render: (r) =>
                          r.fee_rate == null ? (
                            '—'
                          ) : (
                            <span className={value(r, 'fee_rate') > 20 ? 'negative' : ''}>
                              {pct(value(r, 'fee_rate'))}
                            </span>
                          ),
                      },
                      {
                        key: 'settlement',
                        title: 'Settlement',
                        numeric: true,
                        render: (r) => money(value(r, 'settlement')),
                      },
                    ]}
                  />
                </section>
                <section className="panel fee-analysis">
                  <SectionTitle
                    eyebrow="02 / FEE PRESSURE"
                    title="Sales versus fee rate"
                    aside={`${feeRows.length} positive-sales SKU rows`}
                  />
                  <p className="chart-description">
                    Each mark is one SKU on one marketplace. Higher marks lose more of reported
                    sales to marketplace fees; farther-right marks affect more sales.
                  </p>
                  <div className="scatter-chart" aria-label="SKU fee rate versus reported sales">
                    {feeRows.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 14, right: 22, bottom: 16, left: 0 }}>
                          <CartesianGrid stroke={chartGrid} strokeDasharray="2 4" />
                          <XAxis
                            type="number"
                            dataKey="sales"
                            name="Reported sales"
                            tick={{ fill: chartMuted, fontSize: 10 }}
                            tickFormatter={(n: number) => money(n, true)}
                            tickLine={false}
                            axisLine={false}
                            label={{
                              value: 'REPORTED SALES',
                              position: 'insideBottom',
                              offset: -12,
                              fill: chartMuted,
                              fontSize: 9,
                            }}
                          />
                          <YAxis
                            type="number"
                            dataKey="fee_rate"
                            name="Fee / sales"
                            tick={{ fill: chartMuted, fontSize: 10 }}
                            tickFormatter={(n: number) => `${n}%`}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              const row = payload?.[0]?.payload as Row | undefined
                              if (!active || !row) return null
                              return (
                                <div className="scatter-tooltip">
                                  <code>{label(row, 'sku')}</code>
                                  <span>{label(row, 'marketplace')}</span>
                                  <strong>{money(value(row, 'sales'))} sales</strong>
                                  <strong>{pct(value(row, 'fee_rate'))} fee / sales</strong>
                                </div>
                              )
                            }}
                          />
                          <Scatter
                            name="Amazon"
                            data={feeRows.filter((r) => label(r, 'marketplace') === 'Amazon')}
                            fill={chartInk}
                            isAnimationActive={false}
                          />
                          <Scatter
                            name="Noon"
                            data={feeRows.filter((r) => label(r, 'marketplace') === 'Noon')}
                            fill={chartMuted}
                            isAnimationActive={false}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty
                        title="No products to plot"
                        detail="Clear the SKU filter or select another source."
                      />
                    )}
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-key sales" /> Amazon
                    </span>
                    <span>
                      <i className="legend-key settlement" /> Noon
                    </span>
                  </div>
                </section>
                <section className="panel">
                  <SectionTitle
                    eyebrow="03 / PARETO"
                    title="Sales concentration"
                    aside="Window function · cumulative share"
                  />
                  <div className="concentration">
                    <div className="concentration-rows">
                      {concentration.slice(0, 10).map((r) => (
                        <div className="concentration-row" key={label(r, 'sku')}>
                          <span className="rank">{String(value(r, 'rank')).padStart(2, '0')}</span>
                          <code>{label(r, 'sku')}</code>
                          <span className="bar-track">
                            <i style={{ width: `${Math.max(2, value(r, 'cumulative_pct'))}%` }} />
                          </span>
                          <strong>{pct(value(r, 'cumulative_pct'))}</strong>
                        </div>
                      ))}
                    </div>
                    <p className="panel-footnote">
                      Bars show cumulative share of positive SKU sales, ordered by reported sales.
                      Returns are included in each SKU’s net amount.
                    </p>
                  </div>
                </section>
              </div>
            )}
            {tab === 'Activity' && (
              <div className="content">
                <section className="panel">
                  <SectionTitle
                    eyebrow="01 / TIME"
                    title="Reported sales by day"
                    aside="Event date · excludes payout transfers"
                  />
                  <div className="chart-wrap">
                    {days.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={days} margin={{ top: 12, right: 10, bottom: 0, left: 0 }}>
                          <CartesianGrid stroke={chartGrid} vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: chartMuted, fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                          />
                          <YAxis
                            tick={{ fill: chartMuted, fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(n: number) => money(n, true)}
                            width={56}
                          />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(n) => money(Number(n))}
                          />
                          <Area
                            type="monotone"
                            dataKey="Amazon"
                            connectNulls
                            stroke={chartInk}
                            fill={chartInk}
                            fillOpacity={0.08}
                            strokeWidth={2}
                            isAnimationActive={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="Noon"
                            connectNulls
                            stroke={chartMuted}
                            fill={chartMuted}
                            fillOpacity={0.08}
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty
                        title="No dated events"
                        detail="Load a report with valid event dates."
                      />
                    )}
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="source-dot amazon" /> Amazon
                    </span>
                    <span>
                      <i className="source-dot noon" /> Noon
                    </span>
                  </div>
                  <p className="panel-footnote">
                    Lines connect recorded dates. A missing source date is not counted as zero.
                  </p>
                </section>
                <div className="activity-grid">
                  <section className="panel">
                    <SectionTitle
                      eyebrow="02 / TRANSACTIONS"
                      title="Event types"
                      aside="Source-native labels"
                    />
                    <DataTable
                      rows={snapshot.events}
                      columns={[
                        { key: 'marketplace', title: 'Source' },
                        {
                          key: 'event_type',
                          title: 'Type',
                          render: (r) => <code>{label(r, 'event_type')}</code>,
                        },
                        { key: 'rows', title: 'Rows', numeric: true },
                        {
                          key: 'settlement',
                          title: 'Total',
                          numeric: true,
                          render: (r) => money(value(r, 'settlement')),
                        },
                      ]}
                    />
                  </section>
                  <section className="panel quality">
                    <SectionTitle eyebrow="03 / VALIDATION" title="Data checks" />
                    <div className="quality-list">
                      {snapshot.quality.map((r) => (
                        <div key={label(r, 'marketplace')}>
                          <strong>{label(r, 'marketplace')}</strong>
                          <span>{value(r, 'rows')} rows</span>
                          <span>{value(r, 'missing_dates')} missing dates</span>
                          <span>{value(r, 'missing_skus')} rows without SKU</span>
                          <span className={value(r, 'unreconciled_rows') ? 'negative' : 'positive'}>
                            {value(r, 'unreconciled_rows')} unreconciled
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="panel-footnote">
                      Missing SKUs include source-level fees and adjustments. Counts are diagnostic,
                      not automatically errors.
                    </p>
                  </section>
                </div>
              </div>
            )}
            {tab === 'SQL' && (
              <div className="content sql-content">
                <div className="sql-layout">
                  <section className="panel editor-panel">
                    <SectionTitle
                      eyebrow="DUCKDB / QUERY"
                      title="Editor"
                      aside="SELECT and WITH · 200 row preview"
                    />
                    <div className="editor">
                      <div className="line-numbers">
                        {sql.split('\n').map((_, i) => (
                          <span key={i}>{i + 1}</span>
                        ))}
                      </div>
                      <textarea
                        spellCheck={false}
                        aria-label="SQL query"
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault()
                            runSQL()
                          }
                        }}
                      />
                    </div>
                    <div className="editor-footer">
                      <span>⌘ / Ctrl + Enter to run</span>
                      <button className="run-button" onClick={runSQL}>
                        <Play size={13} fill="currentColor" /> Run query
                      </button>
                    </div>
                  </section>
                  <section className="panel schema-panel">
                    <SectionTitle eyebrow="CATALOG" title="Tables & columns" />
                    <div className="catalog">
                      {[...new Set(schema.map((r) => label(r, 'table_name')))].map((table) => (
                        <div key={table}>
                          <div className="catalog-table">
                            <Table2 size={14} />
                            {table}
                            <span>
                              {schema.filter((r) => label(r, 'table_name') === table).length} cols
                            </span>
                          </div>
                          {schema
                            .filter((r) => label(r, 'table_name') === table)
                            .map((r) => (
                              <div className="catalog-column" key={label(r, 'column_name')}>
                                <span>{label(r, 'column_name')}</span>
                                <small>{label(r, 'data_type')}</small>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <section className="panel results-panel">
                  <div className="results-head">
                    <SectionTitle
                      eyebrow="OUTPUT"
                      title="Results"
                      aside={
                        sqlMs == null
                          ? 'Run a query to inspect rows'
                          : `${sqlRows.length} rows · ${sqlMs.toFixed(1)} ms`
                      }
                    />
                  </div>
                  {sqlError ? (
                    <div className="sql-error">
                      <CircleAlert size={16} />
                      <pre>{sqlError}</pre>
                    </div>
                  ) : sqlMs == null ? (
                    <Empty
                      title="Ready for a query"
                      detail="The normalized commerce_events view and both raw tables are available."
                    />
                  ) : sqlRows.length ? (
                    <DataTable
                      rows={sqlRows}
                      columns={Object.keys(sqlRows[0]).map((key) => ({
                        key,
                        title: key,
                        render: (r) => String(r[key] ?? 'NULL'),
                      }))}
                    />
                  ) : (
                    <Empty title="0 rows returned" detail="The query completed successfully." />
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
