CREATE TABLE "wa_session" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sambung_otomatis" boolean DEFAULT false NOT NULL,
	"nomor" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wa_auth" ADD COLUMN "session_id" text DEFAULT 'platform' NOT NULL;--> statement-breakpoint
ALTER TABLE "wa_auth" DROP CONSTRAINT "wa_auth_pkey";--> statement-breakpoint
ALTER TABLE "wa_auth" ADD CONSTRAINT "wa_auth_session_id_key_pk" PRIMARY KEY("session_id","key");--> statement-breakpoint
ALTER TABLE "wa_job" ADD COLUMN "sender_user_id" text;--> statement-breakpoint
ALTER TABLE "wa_session" ADD CONSTRAINT "wa_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_job" ADD CONSTRAINT "wa_job_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wa_job_sender_idx" ON "wa_job" USING btree ("sender_user_id","status","created_at");
--> statement-breakpoint
UPDATE "wa_job" SET "status" = 'dibatalkan', "error" = 'Dibatalkan karena pengiriman kini memakai nomor tiap pengguna. Kirim ulang dari halaman Kirim undangan', "processed_at" = now() WHERE "status" = 'menunggu' AND "sender_user_id" IS NULL;
