-- Idempotent fix: ensure vehicle spec columns exist even if 0004 was recorded but not applied
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "vehicle_type" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "engine_type" varchar(100);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "oil_type" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tire_size" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "oil_filters" text;--> statement-breakpoint

-- Idempotent fix: ensure maintenance enum and table exist even if 0005 was recorded but not applied
DO $$ BEGIN
  CREATE TYPE "public"."maintenance_type" AS ENUM('oil_change', 'tire_rotation', 'tire_change');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "maintenance" (
  "id"          serial PRIMARY KEY NOT NULL,
  "vehicle_id"  integer NOT NULL,
  "type"        "maintenance_type" NOT NULL,
  "date"        date NOT NULL,
  "odometer"    numeric(10, 1),
  "cost"        numeric(8, 2),
  "notes"       text,
  "details"     text,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "maintenance_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action
);
