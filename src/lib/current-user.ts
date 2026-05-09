import { getServerSession } from 'next-auth'
import { eq, isNull } from 'drizzle-orm'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { users, vehicles } from '@/db/schema'

export async function getOrCreateCurrentUser() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return null

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) return existing

  const [created] = await db.insert(users).values({
    email,
    name: session?.user?.name ?? null,
  }).returning()

  return created
}

export async function claimLegacyVehiclesForOwner(userId: number, email: string) {
  const legacyEmail = (
    process.env.LEGACY_OWNER_EMAIL ??
    process.env.ALLOWED_GITHUB_EMAIL
  )?.toLowerCase().trim()
  if (!legacyEmail || legacyEmail !== email) return

  const [ownedVehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.userId, userId))
    .limit(1)

  if (ownedVehicle) return

  await db
    .update(vehicles)
    .set({ userId })
    .where(isNull(vehicles.userId))
}
