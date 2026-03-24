import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { fillups, vehicles } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { Dashboard } from '@/components/Dashboard'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  const [data, vehicleList] = await Promise.all([
    db.select().from(fillups).orderBy(asc(fillups.date)),
    db.select().from(vehicles).orderBy(asc(vehicles.name)),
  ])

  return <Dashboard data={data} vehicles={vehicleList} />
}
