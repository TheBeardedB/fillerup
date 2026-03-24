'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Fillup } from '@/db/schema'
import { FuelCharts } from './FuelCharts'
import { FillupTable } from './FillupTable'
import { StatCards } from './StatCards'
import { format, parseISO } from 'date-fns'

interface Props {
  data: Fillup[]
  isAuthed: boolean
}

export function Dashboard({ data, isAuthed }: Props) {
  const [tab, setTab] = useState<'charts' | 'table'>('charts')

  const first = data[0]
  const last  = data[data.length - 1]
  const totalMiles = last && first
    ? Number(last.odometer) - Number(first.odometer)
    : null

  return (
    <div className="space-y-8">

      {/* Mobile: full-screen New Fill button */}
      <Link
        href="/entry"
        className="sm:hidden flex items-center justify-center w-full h-40 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 transition-colors"
      >
        <span className="font-display text-4xl tracking-widest text-white uppercase">New Fill</span>
      </Link>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#111118] p-8">
        {/* Background decoration */}
        <div className="absolute inset-0 fuel-stripe opacity-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="font-condensed text-xs tracking-[0.3em] uppercase text-red-500 mb-2">
              2012 Suzuki Equator
            </p>
            <h1 className="font-display text-6xl sm:text-8xl tracking-widest text-white leading-none">
              FILL<br />
              <span className="text-red-600">&apos;ER</span> UP
            </h1>
            <p className="font-condensed text-sm tracking-widest text-gray-500 mt-3 uppercase">
              {data.length} fill-ups
              {totalMiles != null && (
                <> &nbsp;·&nbsp; {totalMiles.toLocaleString()} miles tracked</>
              )}
              {first && last && (
                <> &nbsp;·&nbsp; {format(parseISO(first.date as string), 'yyyy')}–{format(parseISO(last.date as string), 'yyyy')}</>
              )}
            </p>
          </div>

          {/* Big MPG stat */}
          <MpgMeter data={data} />
        </div>
      </div>

      <StatCards data={data} />

      {/* Tab switcher */}
      <div className="flex items-center gap-2 border-b border-[#1e1e2e] pb-0">
        <TabBtn active={tab === 'charts'} onClick={() => setTab('charts')}>
          Charts
        </TabBtn>
        <TabBtn active={tab === 'table'}  onClick={() => setTab('table')}>
          Log
        </TabBtn>
      </div>

      {tab === 'charts' ? <FuelCharts data={data} /> : <FillupTable data={data} />}
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

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-condensed text-sm tracking-widest uppercase px-4 py-2.5 border-b-2 transition-colors -mb-px ${
        active
          ? 'border-red-600 text-white'
          : 'border-transparent text-gray-500 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
