CREATE TYPE "public"."maintenance_type" AS ENUM('oil_change', 'tire_rotation', 'tire_change');--> statement-breakpoint
CREATE TABLE "maintenance" (
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
