'use client'
import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import type { Fillup } from '@/db/schema'
import { fmt, fmtCurrency } from '@/lib/utils'

interface Props { data: Fillup[] }

const PAGE_SIZE = 50

export function FillupTable({ data }: Props) {
  const [page, setPage]       = useState(0)
  const [search, setSearch]   = useState('')

  const sorted = useMemo(() => [...data].reverse(), [data])

  const filtered = useMemo(() => {
    if (!search) return sorted
    return sorted.filter(d =>
      d.date?.toString().includes(search) ||
      d.odometer?.toString().includes(search)
    )
  }, [sorted, search])

  const pages     = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Filter by date or odometer…"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0) }}
        className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wide">
              <Th>Date</Th>
              <Th right>Odometer</Th>
              <Th right>Cost</Th>
              <Th right>Gallons</Th>
              <Th right>Miles</Th>
              <Th right>$/Gal</Th>
              <Th right>MPG</Th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr
                key={row.id}
                className={`border-t border-gray-800 ${i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/40'} hover:bg-gray-800/60 transition-colors`}
              >
                <td className="px-4 py-2.5 text-gray-300">
                  {row.date ? format(parseISO(row.date as string), 'MMM d, yyyy') : '—'}
                </td>
                <Td>{Number(row.odometer).toLocaleString()}</Td>
                <Td>{fmtCurrency(row.cost)}</Td>
                <Td>{fmt(row.gallons, 3)}</Td>
                <Td>{fmt(row.milesTravelled, 0)}</Td>
                <Td>{fmtCurrency(row.dolPerGallon)}</Td>
                <Td>{fmt(row.milesPerGallon)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            ← Prev
          </button>
          <span>Page {page + 1} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            className="px-3 py-1 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 font-medium ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-right text-gray-300">{children}</td>
}
