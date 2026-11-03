CREATE TABLE "wa_auth" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'menunggu' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wa_job" ADD CONSTRAINT "wa_job_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_job" ADD CONSTRAINT "wa_job_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wa_job_status_idx" ON "wa_job" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "wa_job_invitation_idx" ON "wa_job" USING btree ("invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wa_job_active_unique" ON "wa_job" USING btree ("guest_id","kind") WHERE "wa_job"."status" in ('menunggu', 'mengirim');