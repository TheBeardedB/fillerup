'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { Fillup, Vehicle } from '@/db/schema'
import { FuelCharts } from './FuelCharts'
import { StatCards } from './StatCards'
import { format, parseISO, subYears } from 'date-fns'

interface Props {
  data: Fillup[]
  vehicles: Vehicle[]
}

export function Dashboard({ data, vehicles }: Props) {
  const { data: session } = useSession()

  // All vehicle IDs selected by default
  const allIds = vehicles.map(v => v.id)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(allIds))

  function toggleVehicle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Don't allow deselecting the last one
        if (next.size === 1) return prev
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredData = vehicles.length > 0
    ? data.filter(d => d.vehicleId != null && selectedIds.has(d.vehicleId))
    : data

  const twoYearsAgo = subYears(new Date(), 2)
  const recentData = filteredData.filter(d => d.date && new Date(d.date as string) >= twoYearsAgo)

  const first = filteredData[0]
  const last  = filteredData[filteredData.length - 1]
  const totalMiles = last && first
    ? Number(last.odometer) - Number(first.odometer)
    : null

  const heroLabel = selectedIds.size === allIds.length
    ? 'All Vehicles'
    : vehicles.filter(v => selectedIds.has(v.id)).map(v => v.name).join(', ')

  const chartLabel = selectedIds.size === allIds.length ? 'All Vehicles' : heroLabel

  return (
    <div className="space-y-8">

      {/* Mobile: full-screen New Fill button (logged in only) */}
      {session && (
        <Link
          href="/entry"
          className="sm:hidden flex items-center justify-center w-full h-40 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 transition-colors"
        >
          <span className="font-display text-4xl tracking-widest text-white uppercase">New Fill</span>
        </Link>
      )}

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#111118] p-8">
        <div className="absolute inset-0 fuel-stripe opacity-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="font-condensed text-xs tracking-[0.3em] uppercase text-red-500 mb-2">
              {heroLabel}
            </p>
            <h1 className="font-display text-6xl sm:text-8xl tracking-widest text-white leading-none">
              FILL<br />
              <span className="text-red-600">&apos;ER</span> UP
            </h1>
            <p className="font-condensed text-sm tracking-widest text-gray-500 mt-3 uppercase">
              {filteredData.length} fill-ups
              {totalMiles != null && (
                <> &nbsp;·&nbsp; {totalMiles.toLocaleString()} miles tracked</>
              )}
              {first && last && (
                <> &nbsp;·&nbsp; {format(parseISO(first.date as string), 'yyyy')}–{format(parseISO(last.date as string), 'yyyy')}</>
              )}
            </p>
          </div>

          <MpgMeter data={filteredData} />
        </div>
      </div>

      {/* Vehicle filter chips */}
      {vehicles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {vehicles.map(v => {
            const active = selectedIds.has(v.id)
            return (
              <button
                key={v.id}
                onClick={() => toggleVehicle(v.id)}
                className={`font-condensed text-sm tracking-widest uppercase px-4 py-2 rounded-xl border transition-colors ${
                  active
                    ? 'bg-red-700/30 border-red-700 text-white'
                    : 'border-[#1e1e2e] text-gray-500 hover:text-white hover:border-gray-600'
                }`}
              >
                {v.name}
                {v.isActive && <span className="ml-1.5 text-red-500">·</span>}
              </button>
            )
          })}
        </div>
      )}

      <StatCards data={filteredData} />

      {/* 2-year chart preview */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-condensed text-xs tracking-[0.25em] uppercase text-gray-500">
            Last 2 Years · {chartLabel}
          </p>
          {vehicles.length > 0 && (
            <Link href="/garage" className="font-condensed text-xs tracking-widest uppercase text-red-500 hover:text-red-400 transition-colors">
              View by vehicle →
            </Link>
          )}
        </div>
        <FuelCharts data={recentData} chartHeight={320} />
      </div>
    </div>
  )
}

function MpgMeter({ data }: { data: Fillup[] }) {
  const vals = data
    .filter(d => d.milesPerGallon != null)
    .map(d => Number(d.milesPerGallon))
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  const best = vals.length ? Math.max(...vals) : null

  return (
    <div className="flex gap-6 sm:gap-8 shrink-0">
      <div className="text-center">
        <div className="font-display text-5xl sm:text-6xl text-white leading-none">
          {avg != null ? avg.toFixed(1) : '—'}
        </div>
        <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mt-1">
          Avg MPG
        </div>
      </div>
      <div className="w-px bg-[#1e1e2e]" />
      <div className="text-center">
        <div className="font-display text-5xl sm:text-6xl text-red-500 leading-none">
          {best != null ? best.toFixed(1) : '—'}
        </div>
        <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mt-1">
          Best MPG
        </div>
      </div>
    </div>
  )
}
