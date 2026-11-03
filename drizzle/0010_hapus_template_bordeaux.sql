UPDATE "invitation" SET "template_key" = 'melati' WHERE "template_key" = 'bordeaux';
--> statement-breakpoint
DELETE FROM "template_registry" WHERE "key" = 'bordeaux';
