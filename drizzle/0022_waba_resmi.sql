ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "waba_allowed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "waba_quota" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "waba_sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waba_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"guest_id" uuid,
	"user_id" text NOT NULL,
	"recipient_phone" text NOT NULL,
	"recipient_name" text NOT NULL,
	"template_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"wamid" text,
	"waba_queue_id" text,
	"reference_id" text,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "waba_message" ADD CONSTRAINT "waba_message_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "waba_message" ADD CONSTRAINT "waba_message_guest_id_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "waba_message" ADD CONSTRAINT "waba_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waba_msg_invitation_idx" ON "waba_message" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waba_msg_user_idx" ON "waba_message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waba_msg_guest_idx" ON "waba_message" USING btree ("guest_id");
