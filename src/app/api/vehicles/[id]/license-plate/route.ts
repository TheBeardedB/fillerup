import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { vehicles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { decryptPlate } from '@/lib/crypto'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [v] = await db
    .select({ licensePlate: vehicles.licensePlate })
    .from(vehicles)
    .where(eq(vehicles.id, Number(params.id)))

  if (!v?.licensePlate) return NextResponse.json({ plate: null })

  return NextResponse.json({ plate: decryptPlate(v.licensePlate) })
}
