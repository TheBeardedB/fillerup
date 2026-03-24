CREATE TABLE IF NOT EXISTS "fillups" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"odometer" numeric(10, 1) NOT NULL,
	"cost" numeric(8, 2) NOT NULL,
	"gallons" numeric(8, 3) NOT NULL,
	"dol_per_gallon" numeric(8, 4),
	"miles_per_gallon" numeric(8, 4),
	"miles_travelled" numeric(10, 1),
	"created_at" timestamp DEFAULT now() NOT NULL
);
