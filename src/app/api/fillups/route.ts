import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { fillups, vehicles } from '@/db/schema'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { calcDerived } from '@/lib/utils'
import { getOrCreateCurrentUser } from '@/lib/current-user'

// GET /api/fillups
// ?latest=1            returns the most recent row (for entry form prev odo)
// ?vehicleId=X         filters by vehicle
// ?latest=1&vehicleId=X  most recent for that vehicle
export async function GET(req: NextRequest) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json([])

  const latest    = req.nextUrl.searchParams.get('latest')
  const vehicleIdParam = req.nextUrl.searchParams.get('vehicleId')
  const vehicleId = vehicleIdParam ? Number(vehicleIdParam) : null

  const userVehicles = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, user.id))
  const userVehicleIds = userVehicles.map(v => v.id)
  if (userVehicleIds.length === 0) return NextResponse.json(latest ? {} : [])

  if (latest) {
    const query = db.select().from(fillups).where(inArray(fillups.vehicleId, userVehicleIds)).orderBy(desc(fillups.date)).limit(1)
    const rows = vehicleId != null
      ? await db.select().from(fillups).where(and(eq(fillups.vehicleId, vehicleId), inArray(fillups.vehicleId, userVehicleIds))).orderBy(desc(fillups.date)).limit(1)
      : await query
    return NextResponse.json(rows[0] ?? {})
  }

  const rows = vehicleId != null
    ? await db.select().from(fillups).where(and(eq(fillups.vehicleId, vehicleId), inArray(fillups.vehicleId, userVehicleIds))).orderBy(asc(fillups.date))
    : await db.select().from(fillups).where(inArray(fillups.vehicleId, userVehicleIds)).orderBy(asc(fillups.date))

  return NextResponse.json(rows)
}

// POST /api/fillups — single entry (auth required)
export async function POST(req: NextRequest) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, odometer, cost, gallons, vehicleId: bodyVehicleId } = body

  if (!date || !odometer || !cost || !gallons)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Resolve vehicleId: use provided, or fall back to active vehicle
  let vehicleId: number | null = bodyVehicleId != null ? Number(bodyVehicleId) : null
  if (vehicleId == null) {
    const active = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
      .limit(1)
    vehicleId = active[0]?.id ?? null
  }
  if (vehicleId == null) return NextResponse.json({ error: 'No vehicle selected' }, { status: 400 })

  const [ownedVehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, user.id)))
    .limit(1)
  if (!ownedVehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })

  // Get previous odometer for this vehicle to compute miles travelled
  const prevQuery = db.select().from(fillups).where(eq(fillups.vehicleId, vehicleId)).orderBy(desc(fillups.date)).limit(1)
  const prev   = await prevQuery
  const prevOdo = prev[0] ? Number(prev[0].odometer) : null
  const derived = calcDerived(prevOdo, Number(odometer), Number(cost), Number(gallons))

  const [row] = await db.insert(fillups).values({
    vehicleId,
    date,
    odometer:       String(odometer),
    cost:           String(cost),
    gallons:        String(gallons),
    dolPerGallon:   derived.dolPerGallon   != null ? String(derived.dolPerGallon)   : null,
    milesPerGallon: derived.milesPerGallon != null ? String(derived.milesPerGallon) : null,
    milesTravelled: derived.milesTravelled != null ? String(derived.milesTravelled) : null,
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
