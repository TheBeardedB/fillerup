'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Fillup, Maintenance, Vehicle } from '@/db/schema'
import { FuelCharts } from './FuelCharts'
import { FillupTable } from './FillupTable'
import { MaintenanceLog } from './MaintenanceLog'
import { format, parseISO } from 'date-fns'

interface Props {
  vehicle: Vehicle
  data: Fillup[]
  serviceRecords: Maintenance[]
}

export function VehicleDetail({ vehicle, data, serviceRecords }: Props) {
  const [tab, setTab] = useState<'charts' | 'table' | 'service'>('charts')

  const valid = (v: unknown) => { const n = Number(v); return v != null && v !== '' && !isNaN(n) && isFinite(n) && n > 0 }
  const withCost = data.map(d => Number(d.cost)).filter(valid)
  const withGal  = data.map(d => Number(d.gallons)).filter(valid)
  const sum      = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  const last = data[data.length - 1]
  const first = data[0]
  const totalSpent = withCost.length ? sum(withCost) : null
  const currentOdo = last ? Number(last.odometer) : null

  const heroTitle = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || vehicle.name

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#111118] p-8">
        <div className="absolute inset-0 fuel-stripe opacity-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <Link
            href="/garage"
            className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-600 hover:text-gray-400 transition-colors mb-4 inline-block"
          >
            ← Garage
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="font-condensed text-xs tracking-[0.3em] uppercase text-red-500 mb-2">
                {vehicle.name}
                {vehicle.isActive && <span className="ml-2 text-gray-600">· Active</span>}
              </p>
              <h1 className="font-display text-5xl sm:text-7xl tracking-widest text-white leading-none">
                {heroTitle}
              </h1>
              <p className="font-condensed text-sm tracking-widest text-gray-500 mt-3 uppercase">
                {data.length} fill-ups
                {first && last && (
                  <> &nbsp;·&nbsp; {format(parseISO(first.date as string), 'yyyy')}–{format(parseISO(last.date as string), 'yyyy')}</>
                )}
                {vehicle.color && <> &nbsp;·&nbsp; {vehicle.color}</>}
              </p>
            </div>

            <MpgMeter data={data} />
          </div>
        </div>
      </div>

      {/* Total stats (totals + ODO) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
          <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">Total Spent</div>
          <div className="font-display text-3xl text-white tracking-wide leading-none">
            {totalSpent != null
              ? `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </div>
          {withGal.length > 0 && (
            <div className="font-condensed text-xs text-gray-600 mt-1.5">
              {sum(withGal).toLocaleString('en-US', { maximumFractionDigits: 0 })} gal total
            </div>
          )}
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
          <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2">Current Odometer</div>
          <div className="font-display text-3xl text-white tracking-wide leading-none">
            {currentOdo != null ? currentOdo.toLocaleString() : '—'}
          </div>
          <div className="font-condensed text-xs text-gray-600 mt-1.5">miles</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 border-b border-[#1e1e2e] pb-0">
        <TabBtn active={tab === 'charts'}  onClick={() => setTab('charts')}>Charts</TabBtn>
        <TabBtn active={tab === 'table'}   onClick={() => setTab('table')}>Log</TabBtn>
        <TabBtn active={tab === 'service'} onClick={() => setTab('service')}>Service</TabBtn>
      </div>

      {tab === 'charts'  && <FuelCharts data={data} chartHeight={280} />}
      {tab === 'table'   && <FillupTable data={data} />}
      {tab === 'service' && <MaintenanceLog vehicle={vehicle} initialRecords={serviceRecords} />}
    </div>
  )
}

function MpgMeter({ data }: { data: Fillup[] }) {
  const vals = data.filter(d => d.milesPerGallon != null).map(d => Number(d.milesPerGallon))
  const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  const best = vals.length ? Math.max(...vals) : null

  return (
    <div className="flex gap-6 sm:gap-8 shrink-0">
      <div className="text-center">
        <div className="font-display text-5xl sm:text-6xl text-white leading-none">
          {avg != null ? avg.toFixed(1) : '—'}
        </div>
        <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mt-1">Avg MPG</div>
      </div>
      <div className="w-px bg-[#1e1e2e]" />
      <div className="text-center">
        <div className="font-display text-5xl sm:text-6xl text-red-500 leading-none">
          {best != null ? best.toFixed(1) : '—'}
        </div>
        <div className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-500 mt-1">Best MPG</div>
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
