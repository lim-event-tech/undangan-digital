CREATE TABLE "music" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "music_invitationId_unique" UNIQUE("invitation_id")
);
--> statement-breakpoint
ALTER TABLE "music" ADD CONSTRAINT "music_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wish_guest_idx" ON "wish" USING btree ("guest_id");