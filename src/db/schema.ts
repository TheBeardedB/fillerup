import { pgTable, serial, date, numeric, timestamp } from 'drizzle-orm/pg-core'

export const fillups = pgTable('fillups', {
  id:            serial('id').primaryKey(),
  date:          date('date').notNull(),
  odometer:      numeric('odometer', { precision: 10, scale: 1 }).notNull(),
  cost:          numeric('cost',     { precision: 8,  scale: 2 }).notNull(),
  gallons:       numeric('gallons',  { precision: 8,  scale: 3 }).notNull(),
  // Derived — stored for convenience, always recalculable
  dolPerGallon:  numeric('dol_per_gallon',  { precision: 8, scale: 4 }),
  milesPerGallon:numeric('miles_per_gallon',{ precision: 8, scale: 4 }),
  milesTravelled:numeric('miles_travelled', { precision: 10, scale: 1 }),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
})

export type Fillup    = typeof fillups.$inferSelect
export type NewFillup = typeof fillups.$inferInsert
