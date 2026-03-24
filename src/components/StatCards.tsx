'use client'
import type { Fillup } from '@/db/schema'
import { fmt, fmtCurrency } from '@/lib/utils'

interface Props { data: Fillup[] }

export function StatCards({ data }: Props) {
  const withMpg  = data.filter(d => d.milesPerGallon != null).map(d => Number(d.milesPerGallon))
  const withCpg  = data.filter(d => d.dolPerGallon   != null).map(d => Number(d.dolPerGallon))
  const withCost = data.filter(d => d.cost            != null).map(d => Number(d.cost))
  const withGal  = data.filter(d => d.gallons         != null).map(d => Number(d.gallons))

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  const last = data[data.length - 1]

  const stats = [
    {
      label: 'Total Spent',
      value: `$${sum(withCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${sum(withGal).toLocaleString('en-US', { maximumFractionDigits: 0 })} gal total`,
    },
    {
      label: 'Avg $/Gallon',
      value: fmtCurrency(avg(withCpg)),
      sub: `best ${fmtCurrency(Math.min(...withCpg))}`,
    },
    {
      label: 'Avg Fill Cost',
      value: fmtCurrency(avg(withCost)),
      sub: `max ${fmtCurrency(Math.max(...withCost))}`,
    },
    {
      label: 'Current Odometer',
      value: last ? `${Number(last.odometer).toLocaleString()}` : '—',
      sub: 'miles',
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
