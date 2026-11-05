DO $$
BEGIN
  LOCK TABLE "invitation", "guest", "rsvp" IN ACCESS EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM "invitation" WHERE "default_max_adults"::bigint + "default_max_children"::bigint NOT BETWEEN 1 AND 40)
    OR EXISTS (SELECT 1 FROM "guest" WHERE "max_adults"::bigint + "max_children"::bigint NOT BETWEEN 1 AND 40)
    OR EXISTS (
      SELECT 1 FROM "rsvp" r JOIN "guest" g ON g.id = r.guest_id
      WHERE r.adults::bigint + r.children::bigint NOT BETWEEN 0 AND 40
        OR (r.attending AND (r.adults::bigint + r.children::bigint < 1 OR r.adults::bigint + r.children::bigint > g.max_adults::bigint + g.max_children::bigint))
        OR (NOT r.attending AND r.adults::bigint + r.children::bigint <> 0)
    ) THEN
    RAISE EXCEPTION 'Konversi peserta dibatalkan: kuota atau jawaban RSVP lama tidak memenuhi aturan. Tinjau data sebelum migrasi.' USING ERRCODE = '23514';
  END IF;
  ALTER TABLE "guest" ADD COLUMN "max_attendees" integer DEFAULT 1 NOT NULL;
  ALTER TABLE "invitation" ADD COLUMN "default_max_attendees" integer DEFAULT 1 NOT NULL;
  ALTER TABLE "rsvp" ADD COLUMN "attendee_count" integer DEFAULT 0 NOT NULL;
  UPDATE "invitation" SET "default_max_attendees" = "default_max_adults" + "default_max_children";
  UPDATE "guest" SET "max_attendees" = "max_adults" + "max_children";
  UPDATE "rsvp" SET "attendee_count" = "adults" + "children";
  ALTER TABLE "guest" DROP CONSTRAINT "guest_max_ck";
  ALTER TABLE "invitation" DROP CONSTRAINT "invitation_default_max_ck";
  ALTER TABLE "rsvp" DROP CONSTRAINT "rsvp_counts_ck";
  ALTER TABLE "guest" DROP COLUMN "max_adults";
  ALTER TABLE "guest" DROP COLUMN "max_children";
  ALTER TABLE "invitation" DROP COLUMN "default_max_adults";
  ALTER TABLE "invitation" DROP COLUMN "default_max_children";
  ALTER TABLE "rsvp" DROP COLUMN "adults";
  ALTER TABLE "rsvp" DROP COLUMN "children";
  ALTER TABLE "guest" ADD CONSTRAINT "guest_max_ck" CHECK ("guest"."max_attendees" between 1 and 40);
  ALTER TABLE "invitation" ADD CONSTRAINT "invitation_default_max_ck" CHECK ("invitation"."default_max_attendees" between 1 and 40);
  ALTER TABLE "rsvp" ADD CONSTRAINT "rsvp_counts_ck" CHECK ("rsvp"."attendee_count" between 0 and 40 and (("rsvp"."attending" and "rsvp"."attendee_count" >= 1) or (not "rsvp"."attending" and "rsvp"."attendee_count" = 0)));
END;
$$;
