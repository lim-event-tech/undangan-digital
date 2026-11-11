DO $$
DECLARE
  r record;
  t text;
BEGIN
  FOR r IN SELECT id, token FROM guest WHERE length(token) <> 8 LOOP
    LOOP
      t := translate(
        encode(substring(decode(replace(gen_random_uuid()::text, '-', ''), 'hex') from 1 for 6), 'base64'),
        '+/',
        '-_'
      );
      EXIT WHEN lower(t) <> 'undangan' AND NOT EXISTS (SELECT 1 FROM guest WHERE token = t);
    END LOOP;
    UPDATE guest SET token = t WHERE id = r.id;
    UPDATE wa_job SET message = replace(message, r.token, t) WHERE guest_id = r.id AND status IN ('menunggu', 'mengirim');
  END LOOP;
END $$;
