import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { fillups, vehicles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { calcDerived } from '@/lib/utils'
import Papa from 'papaparse'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { csv, vehicleId: bodyVehicleId } = await req.json()
  if (!csv) return NextResponse.json({ error: 'No CSV provided' }, { status: 400 })

  // Resolve vehicleId
  let vehicleId: number | null = bodyVehicleId ?? null
  if (vehicleId == null) {
    const active = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.isActive, true)).limit(1)
    vehicleId = active[0]?.id ?? null
  }

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  })

  const rows = parsed.data.map(r => {
    const get = (...keys: string[]) =>
      keys.map(k => r[k] ?? r[k.toLowerCase()] ?? '').find(v => v !== '') ?? ''

    // Strip $ and commas (Apple Numbers exports odometer with commas, cost with $)
    const clean = (v: string) => v.replace(/[$,]/g, '').trim()

    // Normalise date to YYYY-MM-DD (handles both "Jun 8, 2012" and "2012-06-08")
    const rawDate = get('Date')
    let isoDate = ''
    if (rawDate) {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) {
        isoDate = d.toISOString().split('T')[0]
      }
    }

    return {
      date:     isoDate,
      odometer: clean(get('Odometer')),
      cost:     clean(get('Cost')),
      gallons:  clean(get('Gallons')),
    }
  }).filter(r => r.date && r.odometer)

  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const existing = await db.select({ date: fillups.date, odometer: fillups.odometer }).from(fillups)
  const existingSet = new Set(existing.map(e => `${e.date}|${String(Number(e.odometer))}`))

  let inserted = 0
  let skipped  = 0
  let prevOdo: number | null = null

  for (const row of rows) {
    const odo  = Number(row.odometer)
    const cost = Number(row.cost)
    const gal  = Number(row.gallons)

    // Odometer-only row (no fuel data) — use as starting point for mileage calc, don't insert
    if (!row.cost && !row.gallons && odo > 0) {
      prevOdo = odo
      continue
    }

    if (isNaN(odo) || isNaN(cost) || isNaN(gal) || odo <= 0 || gal <= 0) { skipped++; continue }

    const key = `${row.date}|${String(odo)}`
    if (existingSet.has(key)) { skipped++; continue }

    const derived = calcDerived(prevOdo, odo, cost, gal)

    await db.insert(fillups).values({
      vehicleId,
      date:           row.date,
      odometer:       String(odo),
      cost:           String(cost),
      gallons:        String(gal),
      dolPerGallon:   derived.dolPerGallon   != null ? String(derived.dolPerGallon)   : null,
      milesPerGallon: derived.milesPerGallon != null ? String(derived.milesPerGallon) : null,
      milesTravelled: derived.milesTravelled != null ? String(derived.milesTravelled) : null,
    })

    existingSet.add(key)
    prevOdo = odo
    inserted++
  }

  return NextResponse.json({ inserted, skipped })
}
