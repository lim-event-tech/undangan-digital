CREATE TABLE "photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "event_date" date;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "event_time" time;--> statement-breakpoint
ALTER TABLE "photo" ADD CONSTRAINT "photo_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photo_invitation_idx" ON "photo" USING btree ("invitation_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "photo_cover_unique" ON "photo" USING btree ("invitation_id") WHERE "photo"."kind" = 'cover';