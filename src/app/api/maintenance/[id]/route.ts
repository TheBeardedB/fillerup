import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { maintenance } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = Number(params.id)
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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.delete(maintenance).where(eq(maintenance.id, Number(params.id)))
  return NextResponse.json({ ok: true })
}
