'use client'
import { useState } from 'react'
import type { Fillup } from '@/db/schema'
import { FuelCharts } from './FuelCharts'
import { FillupTable } from './FillupTable'
import { StatCards } from './StatCards'

interface Props {
  data: Fillup[]
  isAuthed: boolean
}

export function Dashboard({ data, isAuthed }: Props) {
  const [tab, setTab] = useState<'charts' | 'table'>('charts')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suzuki Equator</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data.length} fill-ups logged</p>
        </div>
        <div className="flex gap-2">
          <TabBtn active={tab === 'charts'} onClick={() => setTab('charts')}>Charts</TabBtn>
          <TabBtn active={tab === 'table'}  onClick={() => setTab('table')}>Table</TabBtn>
        </div>
      </div>

      <StatCards data={data} />

      {tab === 'charts' ? <FuelCharts data={data} /> : <FillupTable data={data} />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
