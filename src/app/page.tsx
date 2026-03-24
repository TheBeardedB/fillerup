import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { fillups } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { Dashboard } from '@/components/Dashboard'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  const data = await db
    .select()
    .from(fillups)
    .orderBy(asc(fillups.date))

  return <Dashboard data={data} isAuthed={!!session} />
}
