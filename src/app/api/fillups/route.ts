import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { fillups } from '@/db/schema'
import { desc, asc } from 'drizzle-orm'
import { calcDerived } from '@/lib/utils'

// GET /api/fillups
// ?latest=1 returns only the most recent row (for entry form prev odo)
export async function GET(req: NextRequest) {
  const latest = req.nextUrl.searchParams.get('latest')

  if (latest) {
    const rows = await db.select().from(fillups).orderBy(desc(fillups.date)).limit(1)
    return NextResponse.json(rows[0] ?? {})
  }

  const rows = await db.select().from(fillups).orderBy(asc(fillups.date))
  return NextResponse.json(rows)
}

// POST /api/fillups — single entry (auth required)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, odometer, cost, gallons } = body

  if (!date || !odometer || !cost || !gallons)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get previous odometer to compute miles travelled
  const prev = await db.select().from(fillups).orderBy(desc(fillups.date)).limit(1)
  const prevOdo = prev[0] ? Number(prev[0].odometer) : null
  const derived = calcDerived(prevOdo, Number(odometer), Number(cost), Number(gallons))

  const [row] = await db.insert(fillups).values({
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
