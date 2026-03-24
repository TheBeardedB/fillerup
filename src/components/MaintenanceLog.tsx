'use client'
import { useState } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useSession } from 'next-auth/react'
import type { Maintenance, Vehicle } from '@/db/schema'

type ServiceType = 'oil_change' | 'tire_rotation' | 'tire_change'

interface OilChangeDetails  { oilType?: string; filterBrand?: string; filterNumber?: string }
interface TireChangeDetails { tireBrand?: string; tireSize?: string; position?: string }
type Details = OilChangeDetails | TireChangeDetails | Record<string, never>

interface OilFilter { brand: string; number: string }

const TYPE_META: Record<ServiceType, { label: string; color: string; bg: string; border: string }> = {
  oil_change:    { label: 'Oil Change',    color: 'text-amber-400',  bg: 'bg-amber-900/20',  border: 'border-amber-900/40' },
  tire_rotation: { label: 'Tire Rotation', color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-900/40' },
  tire_change:   { label: 'Tire Change',   color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-900/40' },
}

function parseDetails(json: string | null): Details {
  if (!json) return {}
  try { return JSON.parse(json) } catch { return {} }
}

function parseFilters(json: string | null): OilFilter[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

function daysSince(dateStr: string) {
  return differenceInDays(new Date(), parseISO(dateStr))
}

// ── Summary card ──────────────────────────────────────────────────────────────
function ServiceSummaryCard({
  type, records, currentOdo,
}: { type: ServiceType; records: Maintenance[]; currentOdo: number | null }) {
  const { label, color, bg, border } = TYPE_META[type]
  const last = [...records].reverse().find(r => r.type === type)

  if (!last) {
    return (
      <div className={`rounded-xl border ${border} ${bg} p-4`}>
        <div className={`font-condensed text-[10px] tracking-[0.2em] uppercase ${color} mb-1`}>{label}</div>
        <div className="font-condensed text-sm text-gray-600">No record</div>
      </div>
    )
  }

  const days = daysSince(last.date as string)
  const milesSince = currentOdo && last.odometer
    ? currentOdo - Number(last.odometer)
    : null

  return (
    <div className={`rounded-xl border ${border} ${bg} p-4`}>
      <div className={`font-condensed text-[10px] tracking-[0.2em] uppercase ${color} mb-1`}>{label}</div>
      <div className="font-display text-2xl text-white leading-none">
        {format(parseISO(last.date as string), 'MMM d, yyyy')}
      </div>
      <div className="font-condensed text-xs text-gray-500 mt-1 space-y-0.5">
        <div>{days === 0 ? 'Today' : `${days} days ago`}</div>
        {milesSince != null && milesSince >= 0 && (
          <div>{milesSince.toLocaleString()} mi ago</div>
        )}
        {last.odometer && (
          <div>at {Number(last.odometer).toLocaleString()} mi</div>
        )}
      </div>
    </div>
  )
}

// ── Add / Edit form ───────────────────────────────────────────────────────────
const EMPTY_FORM = { date: '', odometer: '', cost: '', notes: '' }
const EMPTY_OIL: OilChangeDetails  = { oilType: '', filterBrand: '', filterNumber: '' }
const EMPTY_TIRE: TireChangeDetails = { tireBrand: '', tireSize: '', position: 'all' }

function ServiceForm({
  vehicle,
  initial,
  onSave,
  onCancel,
}: {
  vehicle: Vehicle
  initial?: Maintenance
  onSave: (record: Maintenance) => void
  onCancel: () => void
}) {
  const vehicleFilters = parseFilters(vehicle.oilFilters)

  const [type, setType] = useState<ServiceType>(
    (initial?.type as ServiceType) ?? 'oil_change'
  )
  const [form, setForm] = useState({
    date:     (initial?.date as string)     ?? new Date().toISOString().split('T')[0],
    odometer: initial?.odometer?.toString() ?? '',
    cost:     initial?.cost?.toString()     ?? '',
    notes:    initial?.notes               ?? '',
  })
  const initDetails = parseDetails(initial?.details ?? null)
  const [oilDetails,  setOilDetails]  = useState<OilChangeDetails>({
    oilType:      (initDetails as OilChangeDetails).oilType      ?? vehicle.oilType  ?? '',
    filterBrand:  (initDetails as OilChangeDetails).filterBrand  ?? '',
    filterNumber: (initDetails as OilChangeDetails).filterNumber ?? '',
  })
  const [tireDetails, setTireDetails] = useState<TireChangeDetails>({
    tireBrand: (initDetails as TireChangeDetails).tireBrand ?? '',
    tireSize:  (initDetails as TireChangeDetails).tireSize  ?? vehicle.tireSize ?? '',
    position:  (initDetails as TireChangeDetails).position  ?? 'all',
  })
  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full bg-[#0c0c0f] border border-[#1e1e2e] rounded-xl px-4 py-3 font-body text-white placeholder:text-gray-700 focus:outline-none focus:border-red-800 transition-colors text-sm'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const details = type === 'oil_change'  ? JSON.stringify(oilDetails)
                    : type === 'tire_change' ? JSON.stringify(tireDetails)
                    : null

      const url    = initial ? `/api/maintenance/${initial.id}` : '/api/maintenance'
      const method = initial ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicle.id, type, ...form, details }),
      })
      if (res.ok) onSave(await res.json())
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        {(Object.keys(TYPE_META) as ServiceType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 font-condensed text-xs tracking-widest uppercase py-2.5 rounded-xl border transition-colors ${
              type === t
                ? `${TYPE_META[t].bg} ${TYPE_META[t].border} ${TYPE_META[t].color}`
                : 'border-[#1e1e2e] text-gray-500 hover:text-white'
            }`}
          >
            {TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Date *</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} required />
        </div>
        <div>
          <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Odometer</label>
          <input type="number" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} placeholder="e.g. 94500" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Cost ($)</label>
          <input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="e.g. 45.00" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className={inputCls} />
        </div>
      </div>

      {/* Type-specific fields */}
      {type === 'oil_change' && (
        <div className="grid grid-cols-2 gap-3 border-t border-[#1e1e2e] pt-4">
          <div className="col-span-2">
            <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Oil Type</label>
            <input value={oilDetails.oilType} onChange={e => setOilDetails(d => ({ ...d, oilType: e.target.value }))} placeholder={vehicle.oilType ?? 'e.g. 5W-30'} className={inputCls} />
          </div>
          <div>
            <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Filter Brand</label>
            {vehicleFilters.length > 0 ? (
              <select
                value={oilDetails.filterBrand}
                onChange={e => {
                  const brand  = e.target.value
                  const number = vehicleFilters.find(f => f.brand === brand)?.number ?? ''
                  setOilDetails(d => ({ ...d, filterBrand: brand, filterNumber: number }))
                }}
                className={inputCls}
              >
                <option value="">Select brand…</option>
                {vehicleFilters.map(f => (
                  <option key={f.brand} value={f.brand}>{f.brand}</option>
                ))}
                <option value="other">Other</option>
              </select>
            ) : (
              <input value={oilDetails.filterBrand} onChange={e => setOilDetails(d => ({ ...d, filterBrand: e.target.value }))} placeholder="e.g. Fram" className={inputCls} />
            )}
          </div>
          <div>
            <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Filter Number</label>
            <input value={oilDetails.filterNumber} onChange={e => setOilDetails(d => ({ ...d, filterNumber: e.target.value }))} placeholder="e.g. PH3614" className={inputCls} />
          </div>
        </div>
      )}

      {type === 'tire_change' && (
        <div className="grid grid-cols-2 gap-3 border-t border-[#1e1e2e] pt-4">
          <div>
            <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Tire Brand</label>
            <input value={tireDetails.tireBrand} onChange={e => setTireDetails(d => ({ ...d, tireBrand: e.target.value }))} placeholder="e.g. Michelin" className={inputCls} />
          </div>
          <div>
            <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Tire Size</label>
            <input value={tireDetails.tireSize} onChange={e => setTireDetails(d => ({ ...d, tireSize: e.target.value }))} placeholder={vehicle.tireSize ?? 'e.g. 265/70R16'} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-500 block mb-1">Position Replaced</label>
            <div className="flex gap-2">
              {['all', 'front', 'rear', 'driver front', 'passenger front', 'driver rear', 'passenger rear'].map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setTireDetails(d => ({ ...d, position: pos }))}
                  className={`font-condensed text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-lg border transition-colors ${
                    tireDetails.position === pos
                      ? 'bg-purple-900/30 border-purple-900/60 text-purple-300'
                      : 'border-[#1e1e2e] text-gray-500 hover:text-white'
                  }`}
                >
                  {pos === 'all' ? 'All 4' : pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl py-3 font-condensed tracking-widest uppercase text-sm transition-colors">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Log Service'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 rounded-xl border border-[#1e1e2e] font-condensed text-sm tracking-widest uppercase text-gray-500 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Record row ────────────────────────────────────────────────────────────────
function RecordRow({
  record,
  onEdit,
  onDelete,
  canEdit,
}: { record: Maintenance; onEdit: () => void; onDelete: () => void; canEdit: boolean }) {
  const { label, color, bg, border } = TYPE_META[record.type as ServiceType]
  const details = parseDetails(record.details)
  const oil  = details as OilChangeDetails
  const tire = details as TireChangeDetails
  const [confirmDelete, setConfirmDelete] = useState(false)

  const detailText =
    record.type === 'oil_change'  ? [oil.oilType, oil.filterBrand && oil.filterNumber ? `${oil.filterBrand} ${oil.filterNumber}` : oil.filterBrand].filter(Boolean).join(' · ')
  : record.type === 'tire_change' ? [tire.tireSize, tire.tireBrand, tire.position && tire.position !== 'all' ? tire.position : tire.position === 'all' ? 'all 4' : ''].filter(Boolean).join(' · ')
  : null

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#1e1e2e] last:border-0">
      <span className={`font-condensed text-[10px] tracking-[0.15em] uppercase border rounded-md px-2 py-0.5 shrink-0 mt-0.5 ${bg} ${border} ${color}`}>
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-condensed text-sm text-white">
            {format(parseISO(record.date as string), 'MMM d, yyyy')}
          </span>
          {record.odometer && (
            <span className="font-condensed text-xs text-gray-600">
              {Number(record.odometer).toLocaleString()} mi
            </span>
          )}
          {record.cost && (
            <span className="font-condensed text-xs text-gray-600">
              ${Number(record.cost).toFixed(2)}
            </span>
          )}
        </div>
        {detailText && (
          <div className="font-condensed text-xs text-gray-500 mt-0.5">{detailText}</div>
        )}
        {record.notes && (
          <div className="font-condensed text-xs text-gray-600 mt-0.5 italic">{record.notes}</div>
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="font-condensed text-[10px] tracking-widest uppercase text-gray-600 hover:text-white border border-[#1e1e2e] hover:border-gray-600 rounded-lg px-2 py-1 transition-colors">
            Edit
          </button>
          {confirmDelete ? (
            <>
              <button onClick={onDelete} className="font-condensed text-[10px] tracking-widest uppercase text-red-400 border border-red-900/50 rounded-lg px-2 py-1 transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirmDelete(false)} className="font-condensed text-[10px] tracking-widest uppercase text-gray-600 border border-[#1e1e2e] rounded-lg px-2 py-1 transition-colors">
                ×
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="font-condensed text-[10px] tracking-widest uppercase text-gray-600 hover:text-red-400 border border-[#1e1e2e] hover:border-red-900/50 rounded-lg px-2 py-1 transition-colors">
              Del
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function MaintenanceLog({
  vehicle,
  initialRecords,
}: {
  vehicle: Vehicle
  initialRecords: Maintenance[]
}) {
  const { data: session } = useSession()
  const [records, setRecords] = useState<Maintenance[]>(initialRecords)
  const [showForm, setShowForm]   = useState(false)
  const [editRecord, setEditRecord] = useState<Maintenance | null>(null)

  const currentOdo = (() => {
    // We don't have fillup data here, so pull from the latest maintenance odometer as a proxy
    const withOdo = records.filter(r => r.odometer).map(r => Number(r.odometer))
    return withOdo.length ? Math.max(...withOdo) : null
  })()

  async function handleDelete(id: number) {
    await fetch(`/api/maintenance/${id}`, { method: 'DELETE' })
    setRecords(rs => rs.filter(r => r.id !== id))
  }

  function handleSaved(record: Maintenance) {
    setRecords(rs => {
      const existing = rs.findIndex(r => r.id === record.id)
      if (existing >= 0) {
        const next = [...rs]
        next[existing] = record
        return next.sort((a, b) => (a.date as string).localeCompare(b.date as string))
      }
      return [...rs, record].sort((a, b) => (a.date as string).localeCompare(b.date as string))
    })
    setShowForm(false)
    setEditRecord(null)
  }

  const sorted = [...records].reverse()

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ServiceSummaryCard type="oil_change"    records={records} currentOdo={currentOdo} />
        <ServiceSummaryCard type="tire_rotation" records={records} currentOdo={currentOdo} />
        <ServiceSummaryCard type="tire_change"   records={records} currentOdo={currentOdo} />
      </div>

      {/* Add form */}
      {session && !showForm && !editRecord && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-[#1e1e2e] hover:border-red-900/50 rounded-xl py-3 font-condensed text-sm tracking-widest uppercase text-gray-600 hover:text-red-400 transition-colors"
        >
          + Log Service
        </button>
      )}

      {showForm && (
        <ServiceForm
          vehicle={vehicle}
          onSave={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editRecord && (
        <ServiceForm
          vehicle={vehicle}
          initial={editRecord}
          onSave={handleSaved}
          onCancel={() => setEditRecord(null)}
        />
      )}

      {/* Record list */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 font-condensed text-sm tracking-widest uppercase text-gray-700">
          No service records yet
        </div>
      ) : (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl px-5 py-1">
          {sorted.map(r => (
            <RecordRow
              key={r.id}
              record={r}
              canEdit={!!session}
              onEdit={() => { setEditRecord(r); setShowForm(false) }}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
