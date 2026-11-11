import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { expect, it } from "vitest";
import * as schema from "./schema";
import { getDashboard } from "@/lib/rsvp/dashboard";

const INV = "10000000-0000-4000-8000-000000000001";
const GUEST = "30000000-0000-4000-8000-000000000001";
const folder = path.resolve("drizzle");
const migrationSql = readFileSync(path.join(folder, "0014_rsvp_peserta.sql"), "utf8");

async function legacy() {
  const client = new PGlite();
  const journal = JSON.parse(readFileSync(path.join(folder, "meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
  for (const entry of journal.entries.filter((entry) => entry.tag < "0014")) await client.exec(readFileSync(path.join(folder, `${entry.tag}.sql`), "utf8"));
  await client.exec(`
    insert into "user" (id, name, email) values ('quota-owner', 'Pemilik', 'quota-owner@example.com');
    insert into invitation (id, owner_id, title, slug, status, default_max_adults, default_max_children, content) values
      ('${INV}', 'quota-owner', 'Konferensi Mitra', 'konferensi-mitra', 'terbit', 20, 20, '{"penyelenggara":{"nama":"Instansi A","namaEo":"EO B"},"checkin":{"aktif":false}}');
    insert into event (id, invitation_id, key, name, event_date, event_time, event_end_time, agenda) values
      ('20000000-0000-4000-8000-000000000001', '${INV}', 'hari-1', 'Hari pertama', '2027-02-20', '09:00', '11:00', '[]'),
      ('20000000-0000-4000-8000-000000000002', '${INV}', 'hari-2', 'Hari kedua', '2027-02-21', '09:00', '11:00', '[]');
    update event set sort_order=1 where key='hari-2';
    insert into guest (id, invitation_id, name, phone, token, max_adults, max_children) values
      ('${GUEST}', '${INV}', 'Tamu', '+6281234567890', 'AbCdEfGhIjKlMnOp', 2, 2);
    insert into guest_event (guest_id, event_id) values
      ('${GUEST}', '20000000-0000-4000-8000-000000000001'), ('${GUEST}', '20000000-0000-4000-8000-000000000002');
    insert into rsvp (guest_id, event_id, attending, adults, children, note) values
      ('${GUEST}', '20000000-0000-4000-8000-000000000001', true, 2, 0, 'Catatan tetap'),
      ('${GUEST}', '20000000-0000-4000-8000-000000000002', true, 1, 2, null);
  `);
  return client;
}

async function apply(client: PGlite) {
  await client.exec("BEGIN");
  try {
    await client.exec(migrationSql);
    const journal = JSON.parse(readFileSync(path.join(folder, "meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
    for (const entry of journal.entries.filter((entry) => entry.tag.slice(0, 4) > "0014")) await client.exec(readFileSync(path.join(folder, `${entry.tag}.sql`), "utf8"));
    await client.exec("COMMIT");
  }
  catch (error) { await client.exec("ROLLBACK"); throw error; }
}

it("mengonversi kuota dan jawaban secara utuh serta menghitung maksimum jumlah peserta lintas sesi", async () => {
  const client = await legacy();
  try {
    expect((await client.query("select max(adults)+max(children) as lama, max(adults+children) as baru from rsvp")).rows).toEqual([{ lama: 4, baru: 3 }]);
    await apply(client);
    expect((await client.query("select title,slug,status,default_max_attendees,content from invitation")).rows).toEqual([{ title: "Konferensi Mitra", slug: "konferensi-mitra", status: "terbit", default_max_attendees: 40, content: { penyelenggara: { nama: "Instansi A", namaEo: "EO B" }, checkin: { aktif: false } } }]);
    const guests = (await client.query<{ max_attendees: number; token: string }>("select max_attendees,token from guest")).rows;
    expect(guests).toHaveLength(1);
    expect(guests[0].max_attendees).toBe(4);
    expect(guests[0].token).toMatch(/^[A-Za-z0-9_-]{8}$/);
    expect((await client.query("select attendee_count,note from rsvp order by event_id")).rows).toEqual([{ attendee_count: 2, note: "Catatan tetap" }, { attendee_count: 3, note: null }]);
    const db = drizzle(client, { schema, casing: "snake_case" });
    const dashboard = await getDashboard(db, INV);
    expect(dashboard.totals.attendeeCount).toBe(3);
    expect(dashboard.events.map((event) => event.attendeeCount)).toEqual([2, 3]);
    const columns = (await client.query<{ column_name: string }>("select column_name from information_schema.columns where table_name in ('invitation','guest','rsvp')")).rows.map((row) => row.column_name);
    for (const name of ["adults", "children", "max_adults", "max_children", "default_max_adults", "default_max_children"]) expect(columns).not.toContain(name);
    await client.exec("insert into invitation (owner_id,title,slug) values ('quota-owner','Undangan baru','baru')");
    expect((await client.query("select default_max_attendees from invitation where slug='baru'")).rows).toEqual([{ default_max_attendees: 1 }]);
    await expect(client.exec(`update guest set max_attendees=0 where id='${GUEST}'`)).rejects.toMatchObject({ code: "23514" });
    await expect(client.exec(`update guest set max_attendees=41 where id='${GUEST}'`)).rejects.toMatchObject({ code: "23514" });
    await expect(client.exec("update rsvp set attending=false,attendee_count=1")).rejects.toMatchObject({ code: "23514" });
  } finally { await client.close(); }
});

it("membatalkan migrasi tanpa memangkas kuota lama yang melebihi batas", async () => {
  const client = await legacy();
  try {
    await client.exec(`update guest set max_adults=21,max_children=20 where id='${GUEST}'`);
    await expect(apply(client)).rejects.toMatchObject({ code: "23514" });
    expect((await client.query("select max_adults,max_children from guest")).rows).toEqual([{ max_adults: 21, max_children: 20 }]);
    expect((await client.query("select column_name from information_schema.columns where table_name='guest' and column_name='max_attendees'")).rows).toEqual([]);
  } finally { await client.close(); }
});

it.each([
  { attending: true, adults: 0, children: 0 },
  { attending: true, adults: 5, children: 0 },
  { attending: false, adults: 1, children: 0 },
])("membatalkan migrasi untuk jawaban lama yang tidak konsisten: %j", async (answer) => {
  const client = await legacy();
  try {
    await client.query("update rsvp set attending=$1,adults=$2,children=$3", [answer.attending, answer.adults, answer.children]);
    await expect(apply(client)).rejects.toMatchObject({ code: "23514" });
    expect((await client.query("select adults,children,attending from rsvp")).rows).toEqual([answer, answer]);
  } finally { await client.close(); }
});
