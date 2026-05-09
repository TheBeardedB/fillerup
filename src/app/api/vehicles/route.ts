import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { vehicles, fillups } from '@/db/schema'
import { asc, eq, inArray } from 'drizzle-orm'
import { encryptPlate } from '@/lib/crypto'
import { claimLegacyVehiclesForOwner, getOrCreateCurrentUser } from '@/lib/current-user'

export async function GET() {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json([])

  await claimLegacyVehiclesForOwner(user.id, user.email)

  const allVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.userId, user.id))
    .orderBy(asc(vehicles.name))

  const vehicleIds = allVehicles.map(v => v.id)
  const allFillups = vehicleIds.length
    ? await db.select({ vehicleId: fillups.vehicleId }).from(fillups).where(inArray(fillups.vehicleId, vehicleIds))
    : []

  const countMap = new Map<number, number>()
  for (const f of allFillups) {
    if (f.vehicleId != null) countMap.set(f.vehicleId, (countMap.get(f.vehicleId) ?? 0) + 1)
  }

  // Never expose the raw (encrypted) plate value — revealed via separate auth-gated endpoint
  return NextResponse.json(allVehicles.map(v => ({
    ...v,
    licensePlate: v.licensePlate ? true : null, // just signals "plate exists"
    fillupCount: countMap.get(v.id) ?? 0,
  })))
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, year, make, model, color, licensePlate, initialMileage,
          vehicleType, engineType, oilType, tireSize, oilFilters } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const existing = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.userId, user.id))
  const isFirst = existing.length === 0

  const [row] = await db.insert(vehicles).values({
    userId: user.id,
    name,
    year:           year           ? Number(year)           : null,
    make:           make           || null,
    model:          model          || null,
    color:          color          || null,
    licensePlate:   licensePlate   ? encryptPlate(licensePlate)   : null,
    initialMileage: initialMileage ? Number(initialMileage) : null,
    vehicleType:    vehicleType    || null,
    engineType:     engineType     || null,
    oilType:        oilType        || null,
    tireSize:       tireSize       || null,
    oilFilters:     oilFilters     || null,
    isActive: isFirst,
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
