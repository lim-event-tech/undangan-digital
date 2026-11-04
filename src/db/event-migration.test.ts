import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { expect, it } from "vitest";

it("migrasi event umum menghapus profil dan foto mempelai sambil mempertahankan akun, undangan, dan media umum", async () => {
  const client = new PGlite();
  try {
    const migrations = readMigrationFiles({ migrationsFolder: path.resolve("drizzle") });
    for (const migration of migrations.slice(0, -1)) await client.exec(migration.sql.join("\n"));
    const id = "11111111-1111-4111-8111-111111111111";
    await client.query('INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)', ["migration-owner", "Pengguna", "migration@example.com"]);
    await client.query('INSERT INTO invitation (id, owner_id, slug, groom_name, bride_name, content) VALUES ($1, $2, $3, $4, $5, $6)', [
      id, "migration-owner", "undangan-uji", "Nama lama", "Nama lama lain",
      JSON.stringify({
        pria: { namaLengkap: "Profil lama", orangTua: "Orang tua" },
        wanita: { namaLengkap: "Profil lain" },
        sambutan: "Sambutan yang dipertahankan", checkin: { aktif: false },
        susunan: { urutan: ["sampul", "mempelai", "acara", "rsvp", "penutup"], sembunyi: ["mempelai", "galeri"] },
        pesanWa: "Undangan pernikahan {mempelai}: {link}",
      }),
    ]);
    for (const kind of ["pria", "wanita", "cover", "galeri"]) {
      await client.query("INSERT INTO photo (invitation_id, kind, file_name, content_type, size_bytes, data) VALUES ($1, $2, $3, 'image/jpeg', 3, decode('ffd8ff', 'hex'))", [id, kind, `${kind}.jpg`]);
    }
    await client.query("INSERT INTO platform_setting (key, value) VALUES ('pesanWaBawaan', $1)", [JSON.stringify("Pernikahan {mempelai}: {link}")]);
    await client.exec(migrations.at(-1)!.sql.join("\n"));

    const stored = await client.query<{ title: string; slug: string; content: Record<string, unknown> }>("SELECT title, slug, content FROM invitation WHERE id = $1", [id]);
    expect(stored.rows[0]).toMatchObject({ title: "Event 11111111", slug: "undangan-uji", content: { sambutan: "Sambutan yang dipertahankan", checkin: { aktif: false }, pesanWa: "Undangan acara {event}: {link}" } });
    expect(stored.rows[0].content).not.toHaveProperty("pria");
    expect(stored.rows[0].content).not.toHaveProperty("wanita");
    expect(stored.rows[0].content.susunan).toEqual({ urutan: ["sampul", "acara", "rsvp", "penutup"], sembunyi: ["galeri"] });
    const columns = await client.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_name = 'invitation'");
    expect(columns.rows.map((row) => row.column_name)).not.toContain("groom_name");
    expect(columns.rows.map((row) => row.column_name)).not.toContain("bride_name");
    expect((await client.query<{ kind: string }>("SELECT kind FROM photo ORDER BY kind")).rows.map((row) => row.kind)).toEqual(["cover", "galeri"]);
    expect((await client.query("SELECT id FROM \"user\" WHERE id = 'migration-owner'")).rows).toHaveLength(1);
    expect((await client.query<{ value: string }>("SELECT value FROM platform_setting WHERE key = 'pesanWaBawaan'")).rows[0].value).toBe("acara {event}: {link}");
  } finally {
    await client.close();
  }
});
