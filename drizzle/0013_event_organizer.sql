DO $$
DECLARE
  section_name text;
BEGIN
  ALTER TABLE "event" ADD COLUMN "event_end_time" time;
  ALTER TABLE "event" ADD COLUMN "agenda" jsonb DEFAULT '[]'::jsonb NOT NULL;
  CREATE UNIQUE INDEX "photo_logo_unique" ON "photo" USING btree ("invitation_id","kind") WHERE "photo"."kind" in ('logo_penyelenggara', 'logo_eo');
  UPDATE "invitation" SET "content" = CASE WHEN jsonb_typeof("content") = 'object' THEN "content" ELSE '{}'::jsonb END;
  UPDATE "invitation" SET "content" = jsonb_set("content", '{ucapan}', jsonb_build_object(
    'tampil', CASE WHEN jsonb_typeof("content" #> '{ucapan,tampil}') = 'boolean' THEN "content" #> '{ucapan,tampil}' ELSE 'true'::jsonb END,
    'tahan', CASE WHEN jsonb_typeof("content" #> '{ucapan,tahan}') = 'boolean' THEN "content" #> '{ucapan,tahan}' ELSE 'false'::jsonb END
  )) - 'kutipan' - 'cerita' - 'amplop';
  FOREACH section_name IN ARRAY ARRAY['urutan', 'sembunyi'] LOOP
    UPDATE "invitation" SET "content" = jsonb_set("content", ARRAY['susunan', section_name], COALESCE((
      SELECT jsonb_agg(item ORDER BY position)
      FROM jsonb_array_elements("content" #> ARRAY['susunan', section_name]) WITH ORDINALITY AS element(item, position)
      WHERE item NOT IN ('"cerita"'::jsonb, '"amplop"'::jsonb)
    ), '[]'::jsonb)) WHERE jsonb_typeof("content" #> ARRAY['susunan', section_name]) = 'array';
  END LOOP;
  DELETE FROM "photo" WHERE "kind" = 'qris';
END;
$$;
