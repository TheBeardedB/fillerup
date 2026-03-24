'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface OilFilter { brand: string; number: string }

interface Vehicle {
  id: number
  name: string
  year: number | null
  make: string | null
  model: string | null
  color: string | null
  licensePlate: true | null  // API never returns the real value
  initialMileage: number | null
  isActive: boolean
  fillupCount: number
  vehicleType: string | null
  engineType:  string | null
  oilType:     string | null
  tireSize:    string | null
  oilFilters:  string | null  // JSON text
}

const emptyForm = {
  name: '', year: '', make: '', model: '', color: '', licensePlate: '', initialMileage: '',
  vehicleType: '', engineType: '', oilType: '', tireSize: '',
}

function parseFilters(json: string | null): OilFilter[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

export default function GaragePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [addForm, setAddForm]   = useState(emptyForm)
  const [addFilters, setAddFilters] = useState<OilFilter[]>([])
  const [adding, setAdding]     = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editFilters, setEditFilters] = useState<OilFilter[]>([])
  const [saving, setSaving]     = useState(false)
  const [editLookingUp, setEditLookingUp] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [revealedPlates, setRevealedPlates] = useState<Record<number, string>>({})
  const [revealingId, setRevealingId] = useState<number | null>(null)

  async function revealPlate(id: number) {
    if (revealedPlates[id]) { setRevealedPlates(p => { const n = { ...p }; delete n[id]; return n }); return }
    setRevealingId(id)
    try {
      const res = await fetch(`/api/vehicles/${id}/license-plate`)
      const { plate } = await res.json()
      if (plate) setRevealedPlates(p => ({ ...p, [id]: plate }))
    } finally {
      setRevealingId(null)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => { fetchVehicles() }, [])

  async function fetchVehicles() {
    setLoading(true)
    try {
      const res = await fetch('/api/vehicles')
      setVehicles(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function lookupSpecs(
    form: typeof emptyForm,
    setForm: (f: typeof emptyForm) => void,
    setFilters: (f: OilFilter[]) => void,
    setWorking: (b: boolean) => void,
  ) {
    const { year, make, model } = form
    if (!year || !make || !model) return
    setWorking(true)
    try {
      const params = new URLSearchParams({ year, make, model })
      const res  = await fetch(`/api/vehicles/lookup?${params}`)
      const data = await res.json()
      setForm({
        ...form,
        vehicleType: data.vehicleType ?? form.vehicleType,
        engineType:  data.engineType  ?? form.engineType,
        oilType:     data.oilType     ?? form.oilType,
        tireSize:    data.tireSize    ?? form.tireSize,
      })
    } finally {
      setWorking(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          year: addForm.year || null,
          oilFilters: addFilters.length ? JSON.stringify(addFilters) : null,
        }),
      })
      setAddForm(emptyForm)
      setAddFilters([])
      setShowAdd(false)
      await fetchVehicles()
    } finally {
      setAdding(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (editId == null) return
    setSaving(true)
    try {
      await fetch(`/api/vehicles/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          year: editForm.year || null,
          oilFilters: editFilters.length ? JSON.stringify(editFilters) : null,
        }),
      })
      setEditId(null)
      await fetchVehicles()
    } finally {
      setSaving(false)
    }
  }

  async function setActive(id: number) {
    await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    await fetchVehicles()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    await fetchVehicles()
  }

  if (status === 'loading' || loading) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-condensed text-xs tracking-[0.3em] uppercase text-red-500 mb-1">My Garage</p>
          <h1 className="font-display text-5xl tracking-widest text-white">VEHICLES</h1>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="font-condensed text-sm tracking-widest uppercase px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 transition-colors"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="relative overflow-hidden bg-[#111118] border border-red-900/50 rounded-2xl p-6 space-y-4">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
          <p className="font-condensed text-xs tracking-[0.2em] uppercase text-red-400">New Vehicle</p>
          <VehicleFormFields form={addForm} setForm={setAddForm} filters={addFilters} setFilters={setAddFilters} />
          <LookupButton
            disabled={!addForm.year || !addForm.make || !addForm.model}
            loading={lookingUp}
            onClick={() => lookupSpecs(addForm, setAddForm, setAddFilters, setLookingUp)}
          />
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={adding} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl py-3 font-condensed tracking-widest uppercase text-sm transition-colors">
              {adding ? 'Adding…' : 'Add Vehicle'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setAddForm(emptyForm); setAddFilters([]) }} className="px-5 rounded-xl border border-[#1e1e2e] font-condensed text-sm tracking-widest uppercase text-gray-500 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Vehicle cards */}
      {vehicles.length === 0 && !showAdd && (
        <div className="text-center py-16 text-gray-600 font-condensed tracking-widest uppercase text-sm">
          No vehicles yet
        </div>
      )}

      <div className="space-y-3">
        {vehicles.map(v => (
          <div key={v.id} className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
            {editId === v.id ? (
              <form onSubmit={handleEdit} className="space-y-4">
                <VehicleFormFields form={editForm} setForm={setEditForm} filters={editFilters} setFilters={setEditFilters} />
                <LookupButton
                  disabled={!editForm.year || !editForm.make || !editForm.model}
                  loading={editLookingUp}
                  onClick={() => lookupSpecs(editForm, setEditForm, setEditFilters, setEditLookingUp)}
                />
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl py-2.5 font-condensed tracking-widest uppercase text-sm transition-colors">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="px-5 rounded-xl border border-[#1e1e2e] font-condensed text-sm tracking-widest uppercase text-gray-500 hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/garage/${v.id}`} className="font-display text-xl tracking-widest text-white hover:text-red-400 transition-colors">
                      {v.name}
                    </Link>
                    {v.isActive && (
                      <span className="font-condensed text-[10px] tracking-[0.2em] uppercase bg-red-900/40 text-red-400 border border-red-900/60 rounded-full px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-condensed text-xs text-gray-500 tracking-wider">
                    {[v.year, v.make, v.model, v.color].filter(Boolean).join(' · ')}
                  </div>

                  {/* Spec chips */}
                  {(v.vehicleType || v.engineType || v.oilType || v.tireSize) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {v.vehicleType && <SpecChip label={v.vehicleType} />}
                      {v.engineType  && <SpecChip label={v.engineType} />}
                      {v.oilType     && <SpecChip label={v.oilType} color="amber" />}
                      {v.tireSize    && <SpecChip label={v.tireSize} />}
                    </div>
                  )}

                  {/* Oil filters */}
                  {v.oilFilters && parseFilters(v.oilFilters).length > 0 && (
                    <div className="mt-2">
                      <span className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-600 mr-2">Oil Filters</span>
                      <span className="font-condensed text-xs text-gray-500">
                        {parseFilters(v.oilFilters).map(f => `${f.brand} ${f.number}`).join(' · ')}
                      </span>
                    </div>
                  )}

                  <div className="font-condensed text-xs text-gray-600 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {v.licensePlate && (
                      <span className="flex items-center gap-1.5">
                        {revealedPlates[v.id]
                          ? <span className="text-gray-300">{revealedPlates[v.id]}</span>
                          : <span>••• ••••</span>
                        }
                        <button
                          onClick={() => revealPlate(v.id)}
                          disabled={revealingId === v.id}
                          className="text-gray-500 hover:text-white transition-colors underline underline-offset-2"
                        >
                          {revealingId === v.id ? '…' : revealedPlates[v.id] ? 'hide' : 'show'}
                        </button>
                      </span>
                    )}
                    {v.initialMileage != null && <span>started at {v.initialMileage.toLocaleString()} mi</span>}
                    <span>{v.fillupCount} fill-up{v.fillupCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!v.isActive && (
                    <button
                      onClick={() => setActive(v.id)}
                      className="font-condensed text-xs tracking-widest uppercase text-gray-500 hover:text-white border border-[#1e1e2e] hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditId(v.id)
                      setEditForm({
                        name: v.name, year: v.year?.toString() ?? '', make: v.make ?? '',
                        model: v.model ?? '', color: v.color ?? '', licensePlate: '',
                        initialMileage: v.initialMileage?.toString() ?? '',
                        vehicleType: v.vehicleType ?? '', engineType: v.engineType ?? '',
                        oilType: v.oilType ?? '', tireSize: v.tireSize ?? '',
                      })
                      setEditFilters(parseFilters(v.oilFilters))
                    }}
                    className="font-condensed text-xs tracking-widest uppercase text-gray-500 hover:text-white border border-[#1e1e2e] hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Edit
                  </button>
                  {deleteConfirm === v.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="font-condensed text-xs tracking-widest uppercase text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="font-condensed text-xs tracking-widest uppercase text-gray-500 hover:text-white border border-[#1e1e2e] rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(v.id)}
                      className="font-condensed text-xs tracking-widest uppercase text-gray-600 hover:text-red-400 border border-[#1e1e2e] hover:border-red-900/50 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SpecChip({ label, color = 'default' }: { label: string; color?: 'default' | 'amber' }) {
  const cls = color === 'amber'
    ? 'bg-amber-900/20 border-amber-900/40 text-amber-400'
    : 'bg-[#0c0c0f] border-[#1e1e2e] text-gray-400'
  return (
    <span className={`font-condensed text-[10px] tracking-[0.15em] uppercase border rounded-md px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  )
}

function LookupButton({ disabled, loading, onClick }: { disabled: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full border border-dashed border-[#1e1e2e] hover:border-gray-600 disabled:opacity-40 rounded-xl py-2.5 font-condensed text-xs tracking-widest uppercase text-gray-500 hover:text-white transition-colors"
    >
      {loading ? 'Looking up specs…' : 'Look Up Specs from Web'}
    </button>
  )
}

function OilFilterList({ filters, setFilters }: { filters: OilFilter[]; setFilters: (f: OilFilter[]) => void }) {
  function update(i: number, field: keyof OilFilter, val: string) {
    const next = filters.map((f, idx) => idx === i ? { ...f, [field]: val } : f)
    setFilters(next)
  }
  function remove(i: number) { setFilters(filters.filter((_, idx) => idx !== i)) }
  function add() { setFilters([...filters, { brand: '', number: '' }]) }

  const inputCls = 'bg-[#0c0c0f] border border-[#1e1e2e] rounded-lg px-3 py-2 font-body text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-red-800 transition-colors'

  return (
    <div className="space-y-2">
      <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block">
        Oil Filters by Brand
      </label>
      {filters.map((f, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={f.brand}
            onChange={e => update(i, 'brand', e.target.value)}
            placeholder="Brand (e.g. Fram)"
            className={`${inputCls} flex-1`}
          />
          <input
            value={f.number}
            onChange={e => update(i, 'number', e.target.value)}
            placeholder="Number (e.g. PH3614)"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-gray-600 hover:text-red-400 transition-colors px-1 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="font-condensed text-xs tracking-widest uppercase text-gray-600 hover:text-white transition-colors"
      >
        + Add Filter
      </button>
    </div>
  )
}

function VehicleFormFields({ form, setForm, filters, setFilters }: {
  form: typeof emptyForm
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>
  filters: OilFilter[]
  setFilters: (f: OilFilter[]) => void
}) {
  const inputCls = 'w-full bg-[#0c0c0f] border border-[#1e1e2e] rounded-xl px-4 py-3 font-body text-white placeholder:text-gray-700 focus:outline-none focus:border-red-800 transition-colors'
  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Suzuki Equator" className={inputCls} required />
        </div>
        <div>
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Year</label>
          <input value={form.year} onChange={set('year')} placeholder="2012" type="number" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Color</label>
          <input value={form.color} onChange={set('color')} placeholder="Silver" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Make</label>
          <input value={form.make} onChange={set('make')} placeholder="Suzuki" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Model</label>
          <input value={form.model} onChange={set('model')} placeholder="Equator" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">License Plate</label>
          <input value={form.licensePlate} onChange={set('licensePlate')} placeholder="e.g. ABC-1234" className={inputCls} />
        </div>
        <div>
          <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Initial Mileage</label>
          <input value={form.initialMileage} onChange={set('initialMileage')} placeholder="e.g. 35" type="number" className={inputCls} />
        </div>
      </div>

      <div className="border-t border-[#1e1e2e] pt-4">
        <p className="font-condensed text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-3">Vehicle Specs</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Vehicle Type</label>
            <input value={form.vehicleType} onChange={set('vehicleType')} placeholder="e.g. Truck" className={inputCls} />
          </div>
          <div>
            <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Engine</label>
            <input value={form.engineType} onChange={set('engineType')} placeholder="e.g. 4.0L V6" className={inputCls} />
          </div>
          <div>
            <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Oil Type</label>
            <input value={form.oilType} onChange={set('oilType')} placeholder="e.g. 5W-30" className={inputCls} />
          </div>
          <div>
            <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Tire Size</label>
            <input value={form.tireSize} onChange={set('tireSize')} placeholder="e.g. 265/70R16" className={inputCls} />
          </div>
        </div>
      </div>

      <OilFilterList filters={filters} setFilters={setFilters} />
    </div>
  )
}
