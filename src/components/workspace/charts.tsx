'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyPoint, ProductRow, SummaryRow, Source } from '@/lib/commerce/types'
import type { Analytics } from '@/lib/commerce/analytics'
import { money, pct, shortDate } from '@/lib/format'
import { EmptyState } from './primitives'

const ink = '#eeeeee',
  secondary = '#777777',
  grid = '#242424'
const axis = { fill: '#b3b3b3', fontSize: 12, fontFamily: 'JetBrains Mono Variable' }
const tooltipStyle = {
  background: '#151515',
  border: '1px solid #383838',
  borderRadius: 3,
  padding: '10px 12px',
  boxShadow: '0 6px 20px #00000040',
  fontFamily: 'JetBrains Mono Variable',
  fontSize: 13,
  color: '#eeeeee',
}

export function SourceLegend({ sources }: { sources: Source[] }) {
  return (
    <div className="flex gap-4 text-[12px] text-muted-foreground">
      {sources.map((source) => (
        <span key={source} className="flex items-center gap-1.5">
          <i
            className={
              source === 'Amazon'
                ? 'h-px w-3 bg-white'
                : 'w-3 border-t border-dashed border-neutral-400'
            }
          />
          {source}
        </span>
      ))}
    </div>
  )
}
export function DailySalesChart({ data, height = 268 }: { data: DailyPoint[]; height?: number }) {
  if (!data.length)
    return (
      <EmptyState
        title="No dated events"
        detail="This report has no valid event dates to display."
      />
    )
  return (
    <div className="w-full px-3 pt-5" style={{ height }} aria-label="Daily reported sales chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 26, left: -3, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="day"
            tick={axis}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
            interval="preserveStartEnd"
            tickFormatter={shortDate}
          />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => money(value, true)}
            width={56}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#aaaaaa', marginBottom: 6 }}
            itemStyle={{ color: '#eeeeee', fontSize: 13 }}
            formatter={(value) => money(Number(value))}
            labelFormatter={(label) => shortDate(String(label))}
          />
          <Area
            type="linear"
            dataKey="Amazon"
            stroke={ink}
            fill={ink}
            fillOpacity={0.045}
            strokeWidth={1.8}
            activeDot={{ r: 3, stroke: '#090909', strokeWidth: 2, fill: ink }}
            connectNulls
            isAnimationActive={false}
          />
          <Area
            type="linear"
            dataKey="Noon"
            stroke="#999999"
            fill="transparent"
            strokeWidth={1.5}
            activeDot={{ r: 3, stroke: '#090909', strokeWidth: 2, fill: '#b3b3b3' }}
            strokeDasharray="4 3"
            connectNulls
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
export function MarketplaceChart({ data }: { data: SummaryRow[] }) {
  return (
    <div className="h-40 px-4 pt-3" aria-label="Marketplace sales and settlement chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          barGap={5}
          margin={{ left: 0, right: 20, bottom: 0, top: 0 }}
        >
          <CartesianGrid stroke={grid} horizontal={false} strokeDasharray="2 4" />
          <XAxis
            type="number"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => money(value, true)}
          />
          <YAxis
            type="category"
            dataKey="marketplace"
            tick={{ ...axis, fill: '#bbbbbb' }}
            width={76}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#aaaaaa', marginBottom: 6 }}
            itemStyle={{ color: '#eeeeee', fontSize: 13 }}
            formatter={(value) => money(Number(value))}
            cursor={{ fill: '#ffffff06' }}
          />
          <Bar
            dataKey="sales"
            name="Reported sales"
            fill={ink}
            barSize={8}
            isAnimationActive={false}
          />
          <Bar
            dataKey="commerce_settlement"
            name="Settlement"
            fill={secondary}
            barSize={8}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
export function FeePressureChart({ data }: { data: ProductRow[] }) {
  if (!data.length)
    return (
      <EmptyState
        title="No products to plot"
        detail="Select a source or change the SKU filter to view positive-sales products."
      />
    )
  return (
    <div className="h-72 px-3 pt-4" aria-label="Product sales versus fee rate chart">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 18, left: -6, bottom: 18 }}>
          <CartesianGrid stroke={grid} strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="sales"
            name="Reported sales"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => money(value, true)}
            label={{
              value: 'REPORTED SALES',
              position: 'insideBottom',
              offset: -12,
              fill: '#aaaaaa',
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="fee_rate"
            name="Fee / sales"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${value}%`}
            width={56}
          />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as ProductRow | undefined
              return active && row ? (
                <div className="border border-neutral-700 bg-neutral-900 px-3 py-2 text-[13px] shadow-xl">
                  <div className="font-mono text-white">{row.sku}</div>
                  <div className="mb-2 text-muted-foreground">{row.marketplace}</div>
                  <div>{money(row.sales)} sales</div>
                  <div>{pct(row.fee_rate ?? 0)} fee / sales</div>
                </div>
              ) : null
            }}
          />
          <Scatter
            name="Amazon"
            data={data.filter((row) => row.marketplace === 'Amazon')}
            fill={ink}
            isAnimationActive={false}
          />
          <Scatter
            name="Noon"
            data={data.filter((row) => row.marketplace === 'Noon')}
            fill={secondary}
            shape="diamond"
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SettlementBridgeChart({ data }: { data: Analytics['bridge'] }) {
  return (
    <div className="h-[228px] px-3 pt-5" aria-label="Sales to settlement waterfall chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="name"
            tick={{ ...axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={axis}
            width={54}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => money(value, true)}
          />
          <Tooltip
            cursor={{ fill: '#ffffff05' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Analytics['bridge'][number] | undefined
              return active && row ? (
                <div style={tooltipStyle} className="px-3 py-2">
                  <div className="mb-1 text-neutral-400">{row.name}</div>
                  <span className="font-mono">{money(row.amount)}</span>
                </div>
              ) : null
            }}
          />
          <Bar dataKey="range" maxBarSize={36} isAnimationActive={false}>
            {data.map((row, index) => (
              <Cell
                key={row.name}
                fill={index === 3 ? '#eeeeee' : index === 0 ? '#999999' : '#444444'}
                stroke={index === 1 ? '#999999' : 'none'}
                strokeDasharray={index === 1 ? '2 2' : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
