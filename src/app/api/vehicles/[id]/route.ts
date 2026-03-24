import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { vehicles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { encryptPlate } from '@/lib/crypto'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = Number(params.id)
  const body = await req.json()

  if (body.isActive) {
    await db.update(vehicles).set({ isActive: false })
    await db.update(vehicles).set({ isActive: true }).where(eq(vehicles.id, id))
  } else {
    const { name, year, make, model, color, licensePlate, initialMileage } = body
    await db.update(vehicles).set({
      ...(name           !== undefined && { name }),
      ...(year           !== undefined && { year: year ? Number(year) : null }),
      ...(make           !== undefined && { make:  make  || null }),
      ...(model          !== undefined && { model: model || null }),
      ...(color          !== undefined && { color: color || null }),
      ...(licensePlate   !== undefined && { licensePlate: licensePlate ? encryptPlate(licensePlate) : null }),
      ...(initialMileage !== undefined && { initialMileage: initialMileage ? Number(initialMileage) : null }),
    }).where(eq(vehicles.id, id))
  }

  const [updated] = await db.select().from(vehicles).where(eq(vehicles.id, id))
  return NextResponse.json({ ...updated, licensePlate: updated.licensePlate ? true : null })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id  = Number(params.id)
  const all = await db.select({ id: vehicles.id }).from(vehicles)
  if (all.length <= 1) return NextResponse.json({ error: 'Cannot delete the only vehicle' }, { status: 400 })

  await db.delete(vehicles).where(eq(vehicles.id, id))
  return NextResponse.json({ ok: true })
}
