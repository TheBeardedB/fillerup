import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { vehicles, fillups } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { encryptPlate } from '@/lib/crypto'

export async function GET() {
  const allVehicles = await db.select().from(vehicles).orderBy(asc(vehicles.name))
  const allFillups  = await db.select({ vehicleId: fillups.vehicleId }).from(fillups)

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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, year, make, model, color, licensePlate, initialMileage } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const existing = await db.select({ id: vehicles.id }).from(vehicles)
  const isFirst = existing.length === 0

  const [row] = await db.insert(vehicles).values({
    name,
    year:           year           ? Number(year)           : null,
    make:           make           || null,
    model:          model          || null,
    color:          color          || null,
    licensePlate:   licensePlate   ? encryptPlate(licensePlate)   : null,
    initialMileage: initialMileage ? Number(initialMileage) : null,
    isActive: isFirst,
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
