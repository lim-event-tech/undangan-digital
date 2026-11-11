CREATE TABLE "invitation_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_invite_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "invitation_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_member_unique" UNIQUE("invitation_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "guest" ADD COLUMN "added_by" text;--> statement-breakpoint
ALTER TABLE "invitation_invite" ADD CONSTRAINT "invitation_invite_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_invite" ADD CONSTRAINT "invitation_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_invite" ADD CONSTRAINT "invitation_invite_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_member" ADD CONSTRAINT "invitation_member_invitation_id_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_member" ADD CONSTRAINT "invitation_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_invite_invitation_idx" ON "invitation_invite" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "invitation_member_user_idx" ON "invitation_member" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_invitation_added_by_idx" ON "guest" USING btree ("invitation_id","added_by");--> statement-breakpoint
UPDATE "guest" SET "added_by" = (SELECT "owner_id" FROM "invitation" WHERE "invitation"."id" = "guest"."invitation_id") WHERE "added_by" IS NULL;
