DO $$
DECLARE
  section_name text;
  message_name text;
BEGIN
  ALTER TABLE "invitation" ADD COLUMN "title" text;
  UPDATE "invitation" SET "title" = 'Event ' || left("id"::text, 8);
  ALTER TABLE "invitation" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "invitation" DROP COLUMN "groom_name";
  ALTER TABLE "invitation" DROP COLUMN "bride_name";

  UPDATE "invitation"
  SET "content" = CASE
    WHEN jsonb_typeof("content") = 'object' THEN "content" - 'pria' - 'wanita'
    ELSE '{}'::jsonb
  END;

  FOREACH section_name IN ARRAY ARRAY['urutan', 'sembunyi'] LOOP
    UPDATE "invitation"
    SET "content" = jsonb_set("content", ARRAY['susunan', section_name], COALESCE((
      SELECT jsonb_agg(item ORDER BY position)
      FROM jsonb_array_elements("content" #> ARRAY['susunan', section_name]) WITH ORDINALITY AS element(item, position)
      WHERE item <> '"mempelai"'::jsonb
    ), '[]'::jsonb))
    WHERE jsonb_typeof("content" #> ARRAY['susunan', section_name]) = 'array';
  END LOOP;

  FOREACH message_name IN ARRAY ARRAY['pesanWa', 'pesanPengingat'] LOOP
    UPDATE "invitation"
    SET "content" = jsonb_set("content", ARRAY[message_name], to_jsonb(
      regexp_replace(replace("content" ->> message_name, '{mempelai}', '{event}'), 'pernikahan', 'acara', 'gi')
    ))
    WHERE jsonb_typeof("content" -> message_name) = 'string'
      AND "content" ->> message_name LIKE '%{mempelai}%';
  END LOOP;

  UPDATE "platform_setting"
  SET "value" = to_jsonb(regexp_replace(replace("value" #>> '{}', '{mempelai}', '{event}'), 'pernikahan', 'acara', 'gi'))
  WHERE "key" = 'pesanWaBawaan' AND jsonb_typeof("value") = 'string' AND "value" #>> '{}' LIKE '%{mempelai}%';

  DELETE FROM "photo" WHERE "kind" IN ('pria', 'wanita');
END;
$$;
