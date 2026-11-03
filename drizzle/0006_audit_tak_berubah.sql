CREATE FUNCTION audit_log_tak_berubah() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Log audit tidak bisa diubah atau dihapus';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_log_tanpa_ubah
BEFORE UPDATE OR DELETE ON "audit_log"
FOR EACH ROW EXECUTE FUNCTION audit_log_tak_berubah();
--> statement-breakpoint
CREATE TRIGGER audit_log_tanpa_kosongkan
BEFORE TRUNCATE ON "audit_log"
FOR EACH STATEMENT EXECUTE FUNCTION audit_log_tak_berubah();
