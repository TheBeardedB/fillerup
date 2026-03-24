'use client'
import type { Fillup } from '@/db/schema'
import { fmtCurrency } from '@/lib/utils'

interface Props { data: Fillup[] }

export function StatCards({ data }: Props) {
  const valid = (v: unknown) => { const n = Number(v); return v != null && v !== '' && !isNaN(n) && isFinite(n) && n > 0 }
  const withMpg   = data.map(d => Number(d.milesPerGallon)).filter(valid)
  const withCpg   = data.map(d => Number(d.dolPerGallon)).filter(valid)
  const withCost  = data.map(d => Number(d.cost)).filter(valid)
  const withMiles = data.map(d => Number(d.milesTravelled)).filter(valid)

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const avgMpg   = avg(withMpg)
  const avgCpg   = avg(withCpg)
  const avgCost  = avg(withCost)
  const avgMiles = avg(withMiles)

  const stats = [
    {
      label: 'Avg MPG',
      value: avgMpg  != null ? avgMpg.toFixed(1)  : '—',
      sub:   withMpg.length ? `${withMpg.length} fill-ups` : '',
    },
    {
      label: 'Avg $/Gallon',
      value: fmtCurrency(avgCpg),
      sub:   withCpg.length  ? `best ${fmtCurrency(Math.min(...withCpg))}` : '',
    },
    {
      label: 'Avg Fill Cost',
      value: fmtCurrency(avgCost),
      sub:   withCost.length ? `max ${fmtCurrency(Math.max(...withCost))}` : '',
    },
    {
      label: 'Avg Miles / Fill',
      value: avgMiles != null ? avgMiles.toFixed(0) : '—',
      sub:   withMiles.length ? `max ${Math.max(...withMiles).toFixed(0)} mi` : '',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(s => (
        <div
          key={s.label}
          className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 group hover:border-red-900/50 transition-colors"
        >
          <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">
            {s.label}
          </div>
          <div className="font-display text-3xl text-white tracking-wide leading-none">
            {s.value}
          </div>
          {s.sub && (
            <div className="font-condensed text-xs text-gray-600 mt-1.5">{s.sub}</div>
          )}
        </div>
      ))}
    </div>
  )
}
