'use client'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { Fillup } from '@/db/schema'

interface Props { data: Fillup[] }

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
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{payload[0]?.payload?.dateLabel}</p>
      <p className="font-semibold text-white">
        {Number(payload[0].value).toFixed(decimals)} {unit}
      </p>
    </div>
  )
}

export function FuelCharts({ data }: Props) {
  const chartData = data
    .filter(d => d.date)
    .map(d => ({
      ...d,
      // Coerce numeric DB strings to numbers so recharts scales the Y axis correctly
      milesPerGallon: d.milesPerGallon != null ? Number(d.milesPerGallon) : null,
      dolPerGallon:   d.dolPerGallon   != null ? Number(d.dolPerGallon)   : null,
      cost:           d.cost           != null ? Number(d.cost)           : null,
      gallons:        d.gallons        != null ? Number(d.gallons)        : null,
      milesTravelled: d.milesTravelled != null ? Number(d.milesTravelled) : null,
      dateLabel: format(parseISO(d.date as string), 'MMM d, yyyy'),
      dateShort: format(parseISO(d.date as string), 'yyyy'),
    }))

  return (
    <div className="space-y-6">
      {CHARTS.map(({ key, label, color, unit, decimals }) => {
        const average = avg(data, key)
        return (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-gray-200">{label}</h2>
              {average != null && (
                <span className="text-xs text-gray-400">
                  avg {average.toFixed(decimals)} {unit}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="dateShort"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={v => v.toFixed(decimals > 2 ? 2 : decimals)}
                />
                <Tooltip
                  content={<CustomTooltip unit={unit} decimals={decimals} />}
                />
                {average != null && (
                  <ReferenceLine
                    y={average}
                    stroke="#ffffff"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}
