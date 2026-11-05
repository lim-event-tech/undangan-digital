import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";
import { readContent } from "./content";

it("migrasi EO mempertahankan identitas, status, jadwal, tamu, RSVP, dan pilihan pengaturan", async () => {
  const client = new PGlite();
  try {
    const folder = path.resolve("drizzle");
    const journal = JSON.parse(readFileSync(path.join(folder, "meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
    for (const entry of journal.entries.filter((entry) => entry.tag < "0013")) {
      await client.exec(readFileSync(path.join(folder, `${entry.tag}.sql`), "utf8"));
    }
    await client.exec(`
      insert into "user" (id, name, email) values ('eo-migration', 'Pemilik', 'eo-migration@example.com');
      insert into invitation (id, owner_id, title, slug, status, content) values
        ('10000000-0000-4000-8000-000000000001', 'eo-migration', 'Seminar', 'seminar-lama', 'terbit', '{"kutipan":"Lama","cerita":[{"judul":"Lama"}],"amplop":[{"bank":"Lama"}],"sambutan":"Sambutan tetap","penutup":"Penutup tetap","ucapan":{"tampil":false,"tahan":true},"musik":{"aktif":true},"checkin":{"aktif":false},"susunan":{"urutan":["galeri","cerita","rsvp","amplop"],"sembunyi":["galeri","amplop"]}}'),
        ('10000000-0000-4000-8000-000000000002', 'eo-migration', 'Rapat', 'rapat-lama', 'draf', '{}');
      insert into event (id, invitation_id, key, name, event_date, event_time, timezone) values
        ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'utama', 'Sesi utama', '2027-02-20', '09:00', 'WITA');
      insert into guest (id, invitation_id, name, phone, token, max_adults, max_children) values
        ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Tamu', '+6281234567890', 'AbCdEfGhIjKlMnOp', 3, 1);
      insert into guest_event (guest_id, event_id) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001');
      insert into rsvp (guest_id, event_id, attending, adults, children) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', true, 2, 1);
      insert into photo (invitation_id, kind, file_name, content_type, size_bytes, data) values
        ('10000000-0000-4000-8000-000000000001', 'cover', 'cover.png', 'image/png', 1, decode('01', 'hex')),
        ('10000000-0000-4000-8000-000000000001', 'qris', 'qris.png', 'image/png', 1, decode('02', 'hex'));
    `);
    await client.exec(readFileSync(path.join(folder, "0013_event_organizer.sql"), "utf8"));
    const { rows } = await client.query<{ title: string; slug: string; status: string; content: Record<string, unknown> }>("select title, slug, status, content from invitation order by slug desc");
    const current = rows.find((row) => row.slug === "seminar-lama")!;
    expect(current).toMatchObject({ title: "Seminar", status: "terbit" });
    expect(current.content).toMatchObject({ sambutan: "Sambutan tetap", penutup: "Penutup tetap", ucapan: { tampil: false, tahan: true }, musik: { aktif: true }, checkin: { aktif: false }, susunan: { urutan: ["galeri", "rsvp"], sembunyi: ["galeri"] } });
    for (const key of ["kutipan", "cerita", "amplop"]) expect(current.content).not.toHaveProperty(key);
    expect(readContent(current.content).penyelenggara.nama).toBe("");
    expect(rows.find((row) => row.slug === "rapat-lama")?.content.ucapan).toEqual({ tampil: true, tahan: false });
    expect((await client.query("select event_date::text, event_time::text, event_end_time, agenda, timezone from event")).rows).toEqual([{ event_date: "2027-02-20", event_time: "09:00:00", event_end_time: null, agenda: [], timezone: "WITA" }]);
    expect((await client.query("select max_adults, max_children, token from guest")).rows).toEqual([{ max_adults: 3, max_children: 1, token: "AbCdEfGhIjKlMnOp" }]);
    expect((await client.query("select attending, adults, children from rsvp")).rows).toEqual([{ attending: true, adults: 2, children: 1 }]);
    expect((await client.query("select kind, encode(data, 'hex') as bytes from photo")).rows).toEqual([{ kind: "cover", bytes: "01" }]);
    expect((await client.query("select count(*)::int as n from guest_event")).rows).toEqual([{ n: 1 }]);
  } finally {
    await client.close();
  }
});
