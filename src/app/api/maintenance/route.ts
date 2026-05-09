import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { maintenance, vehicles } from '@/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { getOrCreateCurrentUser } from '@/lib/current-user'

export async function GET(req: NextRequest) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vehicleId = req.nextUrl.searchParams.get('vehicleId')
  if (!vehicleId) return NextResponse.json({ error: 'vehicleId required' }, { status: 400 })

  const [ownedVehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, Number(vehicleId)), eq(vehicles.userId, user.id)))
    .limit(1)
  if (!ownedVehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })

  const rows = await db
    .select()
    .from(maintenance)
    .where(eq(maintenance.vehicleId, Number(vehicleId)))
    .orderBy(asc(maintenance.date))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { vehicleId, type, date, odometer, cost, notes, details } = body

  if (!vehicleId || !type || !date) {
    return NextResponse.json({ error: 'vehicleId, type, and date are required' }, { status: 400 })
  }

  const [ownedVehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, Number(vehicleId)), eq(vehicles.userId, user.id)))
    .limit(1)
  if (!ownedVehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })

  const [row] = await db.insert(maintenance).values({
    vehicleId: Number(vehicleId),
    type,
    date,
    odometer: odometer ? String(odometer) : null,
    cost:     cost     ? String(cost)     : null,
    notes:    notes    || null,
    details:  details  || null,
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
