import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { vehicles } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { encryptPlate } from '@/lib/crypto'
import { getOrCreateCurrentUser } from '@/lib/current-user'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = Number(params.id)
  const body = await req.json()

  if (body.isActive) {
    await db.update(vehicles).set({ isActive: false }).where(eq(vehicles.userId, user.id))
    await db.update(vehicles).set({ isActive: true }).where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id)))
  } else {
    const { name, year, make, model, color, licensePlate, initialMileage,
            vehicleType, engineType, oilType, tireSize, oilFilters } = body
    const normalizedPlate = typeof licensePlate === 'string' ? licensePlate.trim() : undefined
    let encryptedPlate: string | undefined
    if (normalizedPlate) {
      try {
        encryptedPlate = encryptPlate(normalizedPlate)
      } catch (err) {
        console.error('[vehicles] failed to encrypt license plate on update', err)
        return NextResponse.json({ error: 'License plate encryption is not configured correctly on the server.' }, { status: 500 })
      }
    }

    await db.update(vehicles).set({
      ...(name           !== undefined && { name }),
      ...(year           !== undefined && { year: year ? Number(year) : null }),
      ...(make           !== undefined && { make:  make  || null }),
      ...(model          !== undefined && { model: model || null }),
      ...(color          !== undefined && { color: color || null }),
      ...(encryptedPlate !== undefined && { licensePlate: encryptedPlate }),
      ...(initialMileage !== undefined && { initialMileage: initialMileage ? Number(initialMileage) : null }),
      ...(vehicleType    !== undefined && { vehicleType: vehicleType || null }),
      ...(engineType     !== undefined && { engineType:  engineType  || null }),
      ...(oilType        !== undefined && { oilType:     oilType     || null }),
      ...(tireSize       !== undefined && { tireSize:    tireSize    || null }),
      ...(oilFilters     !== undefined && { oilFilters:  oilFilters  || null }),
    }).where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id)))
  }

  const [updated] = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id)))
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...updated, licensePlate: updated.licensePlate ? true : null })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id  = Number(params.id)
  const all = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, user.id))
  if (all.length <= 1) return NextResponse.json({ error: 'Cannot delete the only vehicle' }, { status: 400 })

  await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id)))
  return NextResponse.json({ ok: true })
}
