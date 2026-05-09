import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { vehicles } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { decryptPlate } from '@/lib/crypto'
import { getOrCreateCurrentUser } from '@/lib/current-user'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [v] = await db
    .select({ licensePlate: vehicles.licensePlate })
    .from(vehicles)
    .where(and(eq(vehicles.id, Number(params.id)), eq(vehicles.userId, user.id)))

  if (!v?.licensePlate) return NextResponse.json({ plate: null })

  return NextResponse.json({ plate: decryptPlate(v.licensePlate) })
}
