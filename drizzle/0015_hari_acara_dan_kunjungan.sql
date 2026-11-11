ALTER TABLE "event" ADD COLUMN "event_end_date" date;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "day_times" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvp" ADD COLUMN "visits" jsonb DEFAULT '[]'::jsonb NOT NULL;