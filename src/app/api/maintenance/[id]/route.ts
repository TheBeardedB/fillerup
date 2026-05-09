import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { maintenance, vehicles } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getOrCreateCurrentUser } from '@/lib/current-user'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = Number(params.id)
  const [row] = await db
    .select({ id: maintenance.id })
    .from(maintenance)
    .innerJoin(vehicles, eq(vehicles.id, maintenance.vehicleId))
    .where(and(eq(maintenance.id, id), eq(vehicles.userId, user.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { type, date, odometer, cost, notes, details } = body

  await db.update(maintenance).set({
    ...(type     !== undefined && { type }),
    ...(date     !== undefined && { date }),
    ...(odometer !== undefined && { odometer: odometer ? String(odometer) : null }),
    ...(cost     !== undefined && { cost:     cost     ? String(cost)     : null }),
    ...(notes    !== undefined && { notes:    notes    || null }),
    ...(details  !== undefined && { details:  details  || null }),
  }).where(eq(maintenance.id, id))

  const [updated] = await db.select().from(maintenance).where(eq(maintenance.id, id))
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(params.id)
  const [row] = await db
    .select({ id: maintenance.id })
    .from(maintenance)
    .innerJoin(vehicles, eq(vehicles.id, maintenance.vehicleId))
    .where(and(eq(maintenance.id, id), eq(vehicles.userId, user.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(maintenance).where(eq(maintenance.id, id))
  return NextResponse.json({ ok: true })
}
