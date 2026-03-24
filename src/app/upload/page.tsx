'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

interface Vehicle { id: number; name: string; isActive: boolean }

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [vehicles, setVehicles]   = useState<Vehicle[]>([])
  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState<string[][]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]       = useState<{ inserted: number; skipped: number } | null>(null)
  const [error, setError]         = useState('')

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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    Papa.parse(f, {
      preview: 5,
      complete: (r) => setPreview(r.data as string[][]),
    })
  }

  async function handleUpload() {
    if (!file) return
    setSubmitting(true)
    setError('')
    try {
      const text = await file.text()
      const res = await fetch('/api/fillups/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text, vehicleId }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Import failed')
      setResult(j)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import CSV</h1>
        <p className="text-gray-400 text-sm mt-1">
          Existing rows (matched by date + odometer) are skipped. New rows are inserted.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">

        {vehicles.length > 0 && (
          <div>
            <label className="text-sm text-gray-400 font-medium block mb-2">Vehicle</label>
            <div className="flex flex-wrap gap-2">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleId(v.id)}
                  className={`font-condensed text-sm tracking-widest uppercase px-4 py-2 rounded-xl border transition-colors ${
                    vehicleId === v.id
                      ? 'bg-red-700/30 border-red-700 text-white'
                      : 'border-gray-700 text-gray-500 hover:text-white'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-400 font-medium block mb-2">
            CSV File
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Expected columns: <code className="text-blue-400">Date, Odometer, Cost, Gallons</code>
            {' '}(Miles Travelled, $/Gallon, Miles/Gallon are ignored — recalculated on import)
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
          />
        </div>

        {preview.length > 0 && (
          <div className="overflow-x-auto">
            <p className="text-xs text-gray-400 mb-2">Preview (first 5 rows):</p>
            <table className="w-full text-xs">
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={i === 0 ? 'text-gray-400 font-medium' : 'text-gray-300'}>
                    {row.map((cell, j) => (
                      <td key={j} className="pr-4 py-0.5">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error  && <p className="text-red-400 text-sm">{error}</p>}
        {result && (
          <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-sm">
            <span className="text-green-400 font-semibold">{result.inserted} rows inserted</span>
            {result.skipped > 0 && (
              <span className="text-gray-400 ml-2">({result.skipped} duplicates skipped)</span>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors rounded-xl py-3 font-semibold"
        >
          {submitting ? 'Importing…' : 'Import'}
        </button>
      </div>
    </div>
  )
}
