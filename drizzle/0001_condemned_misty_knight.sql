CREATE TABLE IF NOT EXISTS "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"year" integer,
	"make" varchar(50),
	"model" varchar(50),
	"color" varchar(50),
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fillups" ADD COLUMN "vehicle_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fillups" ADD CONSTRAINT "fillups_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
