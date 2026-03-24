'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { calcDerived, fmt, fmtCurrency } from '@/lib/utils'

export default function EntryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const today = format(new Date(), 'yyyy-MM-dd')

  const [form, setForm] = useState({ date: today, odometer: '', cost: '', gallons: '' })
  const [prevOdo, setPrevOdo] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Fetch latest odometer for derived field preview
  useEffect(() => {
    fetch('/api/fillups?latest=1')
      .then(r => r.json())
      .then(d => setPrevOdo(d.odometer ? Number(d.odometer) : null))
      .catch(() => {})
  }, [])

  const odo  = Number(form.odometer)
  const cost = Number(form.cost)
  const gal  = Number(form.gallons)
  const derived = calcDerived(prevOdo, odo, cost, gal)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/fillups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
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
      <h1 className="text-2xl font-bold">New Fill-Up</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
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
            placeholder="e.g. 129727"
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
        {odo > 0 && cost > 0 && gal > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Stat label="$/Gal"      value={fmtCurrency(derived.dolPerGallon)} />
            <Stat label="Miles"      value={fmt(derived.milesTravelled, 0)} />
            <Stat label="MPG"        value={fmt(derived.milesPerGallon)} />
          </div>
        )}

        {error   && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Saved!</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors rounded-xl py-3 font-semibold"
        >
          {submitting ? 'Saving…' : 'Save Fill-Up'}
        </button>
      </form>
    </div>
  )
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-400 font-medium">{label}</label>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  )
}
