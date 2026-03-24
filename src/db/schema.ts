import { pgTable, serial, date, numeric, timestamp, varchar, integer, boolean, text, pgEnum } from 'drizzle-orm/pg-core'

export const maintenanceTypeEnum = pgEnum('maintenance_type', ['oil_change', 'tire_rotation', 'tire_change'])

export const vehicles = pgTable('vehicles', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 100 }).notNull(),
  year:      integer('year'),
  make:      varchar('make', { length: 50 }),
  model:     varchar('model', { length: 50 }),
  color:          varchar('color', { length: 50 }),
  licensePlate:   varchar('license_plate', { length: 200 }),
  initialMileage: integer('initial_mileage'),
  isActive:       boolean('is_active').default(false).notNull(),
  // Spec fields
  vehicleType: varchar('vehicle_type', { length: 50 }),   // e.g. "Truck", "SUV"
  engineType:  varchar('engine_type',  { length: 100 }),  // e.g. "4.0L V6"
  oilType:     varchar('oil_type',     { length: 50 }),   // e.g. "5W-30"
  tireSize:    varchar('tire_size',    { length: 50 }),   // e.g. "265/70R16"
  oilFilters:  text('oil_filters'),                       // JSON: [{"brand":"Fram","number":"PH3614"}]
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const fillups = pgTable('fillups', {
  id:             serial('id').primaryKey(),
  vehicleId:      integer('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }),
  date:           date('date').notNull(),
  odometer:       numeric('odometer', { precision: 10, scale: 1 }).notNull(),
  cost:           numeric('cost',     { precision: 8,  scale: 2 }).notNull(),
  gallons:        numeric('gallons',  { precision: 8,  scale: 3 }).notNull(),
  // Derived — stored for convenience, always recalculable
  dolPerGallon:   numeric('dol_per_gallon',  { precision: 8, scale: 4 }),
  milesPerGallon: numeric('miles_per_gallon',{ precision: 8, scale: 4 }),
  milesTravelled: numeric('miles_travelled', { precision: 10, scale: 1 }),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
})

export const maintenance = pgTable('maintenance', {
  id:        serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  type:      maintenanceTypeEnum('type').notNull(),
  date:      date('date').notNull(),
  odometer:  numeric('odometer', { precision: 10, scale: 1 }),
  cost:      numeric('cost',     { precision: 8,  scale: 2 }),
  notes:     text('notes'),
  details:   text('details'),  // JSON for type-specific fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Vehicle     = typeof vehicles.$inferSelect
export type NewVehicle   = typeof vehicles.$inferInsert
export type Fillup       = typeof fillups.$inferSelect
export type NewFillup    = typeof fillups.$inferInsert
export type Maintenance  = typeof maintenance.$inferSelect
