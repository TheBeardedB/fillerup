import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { maintenance } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get('vehicleId')
  if (!vehicleId) return NextResponse.json({ error: 'vehicleId required' }, { status: 400 })

  const rows = await db
    .select()
    .from(maintenance)
    .where(eq(maintenance.vehicleId, Number(vehicleId)))
    .orderBy(asc(maintenance.date))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { vehicleId, type, date, odometer, cost, notes, details } = body

  if (!vehicleId || !type || !date) {
    return NextResponse.json({ error: 'vehicleId, type, and date are required' }, { status: 400 })
  }

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
