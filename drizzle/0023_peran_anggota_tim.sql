ALTER TABLE "invitation_invite" ADD COLUMN "role" text DEFAULT 'anggota' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation_invite" ADD COLUMN "checkin_access" text DEFAULT 'milik' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation_member" ADD COLUMN "role" text DEFAULT 'anggota' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation_member" ADD COLUMN "checkin_access" text DEFAULT 'milik' NOT NULL;
