'use client'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import type { Fillup } from '@/db/schema'

interface Props { data: Fillup[]; chartHeight?: number }

const CHARTS: {
  key:   keyof Fillup
  label: string
  color: string
  unit:  string
  decimals: number
}[] = [
  { key: 'milesPerGallon', label: 'Miles / Gallon', color: '#60a5fa', unit: 'mpg', decimals: 2 },
  { key: 'dolPerGallon',   label: '$ / Gallon',     color: '#f87171', unit: '$',   decimals: 3 },
  { key: 'cost',           label: 'Fill Cost',       color: '#fbbf24', unit: '$',   decimals: 2 },
  { key: 'gallons',        label: 'Gallons',         color: '#34d399', unit: 'gal', decimals: 3 },
  { key: 'milesTravelled', label: 'Miles Travelled', color: '#a78bfa', unit: 'mi',  decimals: 0 },
]

function avg(data: Fillup[], key: keyof Fillup) {
  const vals = data.map(d => Number(d[key])).filter(n => !isNaN(n) && n > 0)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function CustomTooltip({ active, payload, unit, decimals }: any) {
  if (!active || !payload?.length) return null
  const main  = payload.find((p: any) => !String(p.dataKey).endsWith('_trend'))
  const trend = payload.find((p: any) =>  String(p.dataKey).endsWith('_trend'))
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{payload[0]?.payload?.dateLabel}</p>
      {main?.value  != null && (
        <p className="font-semibold text-white">{Number(main.value).toFixed(decimals)} {unit}</p>
      )}
      {trend?.value != null && (
        <p className="text-gray-400 text-xs mt-0.5">trend {Number(trend.value).toFixed(decimals)} {unit}</p>
      )}
    </div>
  )
}

export function FuelCharts({ data, chartHeight = 200 }: Props) {
  const baseData = data
    .filter(d => d.date)
    .map(d => ({
      ...d,
      milesPerGallon: d.milesPerGallon != null ? Number(d.milesPerGallon) : null,
      dolPerGallon:   d.dolPerGallon   != null ? Number(d.dolPerGallon)   : null,
      cost:           d.cost           != null ? Number(d.cost)           : null,
      gallons:        d.gallons        != null ? Number(d.gallons)        : null,
      milesTravelled: d.milesTravelled != null ? Number(d.milesTravelled) : null,
      dateLabel: format(parseISO(d.date as string), 'MMM d, yyyy'),
      dateShort: format(parseISO(d.date as string), 'MMM yyyy'),
    }))

  // Attach a 90-day rolling average for each chart key
  const chartData = baseData.map(point => {
    const pointDate = parseISO(point.date as string)
    const cutoff    = subDays(pointDate, 90)
    const extra: Record<string, number | null> = {}
    for (const { key } of CHARTS) {
      const window = baseData.filter(p => {
        const v = p[key as keyof typeof p]
        if (v == null) return false
        const d = parseISO(p.date as string)
        return d >= cutoff && d <= pointDate
      })
      extra[`${key}_trend`] = window.length
        ? window.reduce((sum, p) => sum + (p[key as keyof typeof p] as number), 0) / window.length
        : null
    }
    return { ...point, ...extra }
  })

  // One tick per quarter (Jan/Apr/Jul/Oct), deduped
  const quarterTicks = chartData
    .filter(d => [0, 3, 6, 9].includes(parseISO(d.date as string).getMonth()))
    .map(d => d.dateShort)
    .filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <div className="space-y-6">
      {CHARTS.map(({ key, label, color, unit, decimals }) => {
        const average   = avg(data, key)
        const trendKey  = `${key}_trend`
        return (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-sm text-gray-200">{label}</h2>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="inline-block w-4 border-t-2 border-dashed opacity-60" style={{ borderColor: color }} />
                  trend
                </span>
              </div>
              {average != null && (
                <span className="text-xs text-gray-400">
                  avg {average.toFixed(decimals)} {unit}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="dateShort"
                  ticks={quarterTicks}
                  interval={0}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={v => v.toFixed(decimals > 2 ? 2 : decimals)}
                />
                <Tooltip content={<CustomTooltip unit={unit} decimals={decimals} />} />
                {average != null && (
                  <ReferenceLine
                    y={average}
                    stroke="#ffffff"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                )}
                {/* Raw data line */}
                <Line
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  dot={false}
                  activeDot={{ r: 3, fill: color }}
                />
                {/* Rolling 90-day trend line */}
                <Line
                  type="monotone"
                  dataKey={trendKey}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}
