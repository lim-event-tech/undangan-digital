CREATE TABLE "admin_role" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "admin_role" ("key", "label", "permissions", "sort_order") VALUES
	('super', 'Super admin', '["lihat","lihat-tamu","kelola-undangan","ubah-undangan","kelola-akun","tangguhkan","hapus","template","pengaturan","tim"]'::jsonb, 0),
	('dukungan', 'Dukungan', '["lihat","ubah-undangan"]'::jsonb, 1),
	('lihat', 'Hanya lihat', '["lihat"]'::jsonb, 2);
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_admin_role_admin_role_key_fk" FOREIGN KEY ("admin_role") REFERENCES "public"."admin_role"("key") ON DELETE restrict ON UPDATE no action;