import { db } from './index'
import { vehicles } from './schema'

async function seed() {
  const existing = await db.select().from(vehicles)
  if (existing.length === 0) {
    await db.insert(vehicles).values({
      name:           'Suzuki Equator',
      year:           2012,
      make:           'Suzuki',
      model:          'Equator',
      color:          'Silver',
      initialMileage: 35,
      isActive:       true,
    })
    console.log('Seeded: Suzuki Equator')
  } else {
    console.log('Vehicles already exist, skipping seed')
  }
  process.exit(0)
}

seed()
