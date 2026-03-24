'use client'
import type { Fillup } from '@/db/schema'
import { fmt, fmtCurrency } from '@/lib/utils'

interface Props { data: Fillup[] }

export function StatCards({ data }: Props) {
  const withMpg  = data.filter(d => d.milesPerGallon != null).map(d => Number(d.milesPerGallon))
  const withCpg  = data.filter(d => d.dolPerGallon   != null).map(d => Number(d.dolPerGallon))
  const withCost = data.filter(d => d.cost            != null).map(d => Number(d.cost))

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  const last = data[data.length - 1]

  const stats = [
    { label: 'Avg MPG',       value: fmt(avg(withMpg)) },
    { label: 'Avg $/Gallon',  value: fmtCurrency(avg(withCpg)) },
    { label: 'Total Spent',   value: `$${sum(withCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Last Odometer', value: last ? `${Number(last.odometer).toLocaleString()} mi` : '—' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">{s.label}</div>
          <div className="text-xl font-semibold mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  )
}
