'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { calcDerived, fmt, fmtCurrency } from '@/lib/utils'

interface Vehicle { id: number; name: string; isActive: boolean }

export default function EntryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const today = format(new Date(), 'yyyy-MM-dd')

  const [vehicles, setVehicles]     = useState<Vehicle[]>([])
  const [vehicleId, setVehicleId]   = useState<number | null>(null)
  const [form, setForm]             = useState({ date: today, odometer: '', cost: '', gallons: '' })
  const [prevOdo, setPrevOdo]       = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.json())
      .then((vs: Vehicle[]) => {
        setVehicles(vs)
        const active = vs.find(v => v.isActive) ?? vs[0]
        if (active) setVehicleId(active.id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const url = vehicleId != null
      ? `/api/fillups?latest=1&vehicleId=${vehicleId}`
      : '/api/fillups?latest=1'
    fetch(url)
      .then(r => r.json())
      .then(d => setPrevOdo(d.odometer ? Number(d.odometer) : null))
      .catch(() => {})
  }, [vehicleId])

  const odo  = Number(form.odometer)
  const cost = Number(form.cost)
  const gal  = Number(form.gallons)
  const derived = calcDerived(prevOdo, odo, cost, gal)
  const showPreview = odo > 0 && cost > 0 && gal > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/fillups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vehicleId }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Failed to save')
      }
      setSuccess(true)
      setForm({ date: today, odometer: '', cost: '', gallons: '' })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <p className="font-condensed text-xs tracking-[0.3em] uppercase text-red-500 mb-1">New Entry</p>
        <h1 className="font-display text-5xl tracking-widest text-white">FILL UP</h1>
      </div>

      <form onSubmit={handleSubmit} className="relative overflow-hidden bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 space-y-5">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

        {vehicles.length > 0 && (
          <Field label="Vehicle">
            <div className="flex flex-wrap gap-2">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleId(v.id)}
                  className={`font-condensed text-sm tracking-widest uppercase px-4 py-2.5 rounded-xl border transition-colors ${
                    vehicleId === v.id
                      ? 'bg-red-700/30 border-red-700 text-white'
                      : 'border-[#1e1e2e] text-gray-500 hover:text-white'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Date">
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className={inputCls}
            required
          />
        </Field>

        <Field label="Odometer (mi)">
          <input
            type="number"
            inputMode="decimal"
            value={form.odometer}
            onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
            placeholder={prevOdo ? `last: ${prevOdo.toLocaleString()}` : 'e.g. 129727'}
            className={inputCls}
            required
          />
        </Field>

        <Field label="Total Cost ($)">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.cost}
            onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
            placeholder="e.g. 51.60"
            className={inputCls}
            required
          />
        </Field>

        <Field label="Gallons">
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            value={form.gallons}
            onChange={e => setForm(f => ({ ...f, gallons: e.target.value }))}
            placeholder="e.g. 14.538"
            className={inputCls}
            required
          />
        </Field>

        {/* Live derived preview */}
        {showPreview && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <PreviewStat label="$/Gal" value={fmtCurrency(derived.dolPerGallon)} />
            <PreviewStat label="Miles" value={fmt(derived.milesTravelled, 0)} />
            <PreviewStat label="MPG"   value={fmt(derived.milesPerGallon)} highlight={
              derived.milesPerGallon != null && derived.milesPerGallon > 18
            } />
          </div>
        )}

        {error   && <p className="font-condensed text-sm text-red-400 tracking-wide">{error}</p>}
        {success && <p className="font-condensed text-sm text-green-400 tracking-widest uppercase">Saved!</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 transition-colors rounded-xl py-3.5 font-condensed tracking-widest uppercase text-sm font-medium"
        >
          {submitting ? 'Saving…' : 'Save Fill-Up'}
        </button>
      </form>
    </div>
  )
}

const inputCls = [
  'w-full bg-[#0c0c0f] border border-[#1e1e2e] rounded-xl px-4 py-3.5',
  'font-body text-lg text-white placeholder:text-gray-700',
  'focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-900',
  'transition-colors',
].join(' ')

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-condensed text-xs tracking-[0.2em] uppercase text-gray-500">
        {label}
      </label>
      {children}
    </div>
  )
}

function PreviewStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#0c0c0f] border border-[#1e1e2e] rounded-xl p-3 text-center">
      <div className="font-condensed text-[10px] tracking-[0.2em] uppercase text-gray-600">{label}</div>
      <div className={`font-display text-2xl mt-0.5 tracking-wide ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
