import { db } from '@/db'
import { fillups, vehicles } from '@/db/schema'
import { asc, eq, inArray } from 'drizzle-orm'
import { Dashboard } from '@/components/Dashboard'
import { getOrCreateCurrentUser } from '@/lib/current-user'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getOrCreateCurrentUser()
  if (!user) return <Dashboard data={[]} vehicles={[]} />

  const vehicleList = await db.select().from(vehicles).where(eq(vehicles.userId, user.id)).orderBy(asc(vehicles.name))
  if (vehicleList.length === 0) redirect('/garage?new=1')

  const vehicleIds = vehicleList.map(v => v.id)
  const data = vehicleIds.length
    ? await db.select().from(fillups).where(inArray(fillups.vehicleId, vehicleIds)).orderBy(asc(fillups.date))
    : []

  return <Dashboard data={data} vehicles={vehicleList} />
}
