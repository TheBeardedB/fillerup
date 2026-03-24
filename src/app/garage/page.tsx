'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Vehicle {
  id: number
  name: string
  year: number | null
  make: string | null
  model: string | null
  color: string | null
  isActive: boolean
  fillupCount: number
}

const emptyForm = { name: '', year: '', make: '', model: '', color: '' }

export default function GaragePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [addForm, setAddForm]   = useState(emptyForm)
  const [adding, setAdding]     = useState(false)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, year: addForm.year || null }),
      })
      setAddForm(emptyForm)
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
        body: JSON.stringify({ ...editForm, year: editForm.year || null }),
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
          <VehicleFormFields form={addForm} setForm={setAddForm} />
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={adding} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl py-3 font-condensed tracking-widest uppercase text-sm transition-colors">
              {adding ? 'Adding…' : 'Add Vehicle'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setAddForm(emptyForm) }} className="px-5 rounded-xl border border-[#1e1e2e] font-condensed text-sm tracking-widest uppercase text-gray-500 hover:text-white transition-colors">
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
                <VehicleFormFields form={editForm} setForm={setEditForm} />
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
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display text-xl tracking-widest text-white">{v.name}</span>
                    {v.isActive && (
                      <span className="font-condensed text-[10px] tracking-[0.2em] uppercase bg-red-900/40 text-red-400 border border-red-900/60 rounded-full px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-condensed text-xs text-gray-500 tracking-wider">
                    {[v.year, v.make, v.model, v.color].filter(Boolean).join(' · ')}
                  </div>
                  <div className="font-condensed text-xs text-gray-600 mt-1">
                    {v.fillupCount} fill-up{v.fillupCount !== 1 ? 's' : ''}
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
                    onClick={() => { setEditId(v.id); setEditForm({ name: v.name, year: v.year?.toString() ?? '', make: v.make ?? '', model: v.model ?? '', color: v.color ?? '' }) }}
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

function VehicleFormFields({ form, setForm }: {
  form: typeof emptyForm
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>
}) {
  const inputCls = 'w-full bg-[#0c0c0f] border border-[#1e1e2e] rounded-xl px-4 py-3 font-body text-white placeholder:text-gray-700 focus:outline-none focus:border-red-800 transition-colors'
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Name *</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Suzuki Equator" className={inputCls} required />
      </div>
      <div>
        <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Year</label>
        <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2012" type="number" className={inputCls} />
      </div>
      <div>
        <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Color</label>
        <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Silver" className={inputCls} />
      </div>
      <div>
        <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Make</label>
        <input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Suzuki" className={inputCls} />
      </div>
      <div>
        <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500 block mb-1">Model</label>
        <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Equator" className={inputCls} />
      </div>
    </div>
  )
}
