import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const folder = path.resolve("drizzle");
const INV = "10000000-0000-4000-8000-000000000001";
const G1 = "30000000-0000-4000-8000-000000000001";
const G2 = "30000000-0000-4000-8000-000000000002";
const G3 = "30000000-0000-4000-8000-000000000003";
const OLD1 = "AbCdEfGhIjKlMnOp";
const OLD2 = "QrStUvWxYz012345";
const KEPT = "pendek_1";

it("mengganti token tamu lama menjadi 8 karakter dan memperbarui tautan pada pesan yang masih menunggu", async () => {
  const client = new PGlite();
  try {
    const journal = JSON.parse(readFileSync(path.join(folder, "meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
    for (const entry of journal.entries.filter((entry) => entry.tag < "0019")) await client.exec(readFileSync(path.join(folder, `${entry.tag}.sql`), "utf8"));
    await client.exec(`
      insert into "user" (id, name, email) values ('pemilik', 'Pemilik', 'pemilik@example.com');
      insert into invitation (id, owner_id, title, slug, status) values ('${INV}', 'pemilik', 'Konferensi Mitra', 'konferensi-mitra', 'terbit');
      insert into guest (id, invitation_id, name, phone, token) values
        ('${G1}', '${INV}', 'Tamu Satu', '+6281234567891', '${OLD1}'),
        ('${G2}', '${INV}', 'Tamu Dua', '+6281234567892', '${OLD2}'),
        ('${G3}', '${INV}', 'Tamu Tiga', '+6281234567893', '${KEPT}');
      insert into wa_job (invitation_id, guest_id, kind, phone, message, status) values
        ('${INV}', '${G1}', 'undangan', '+6281234567891', 'Buka https://contoh.id/${OLD1}', 'menunggu'),
        ('${INV}', '${G2}', 'undangan', '+6281234567892', 'Buka https://contoh.id/${OLD2}', 'terkirim');
    `);
    await client.exec(readFileSync(path.join(folder, "0019_token_tamu_pendek.sql"), "utf8"));
    const guests = (await client.query<{ id: string; token: string }>("select id, token from guest order by name")).rows;
    for (const row of guests) expect(row.token).toMatch(/^[A-Za-z0-9_-]{8}$/);
    expect(new Set(guests.map((row) => row.token)).size).toBe(3);
    expect(guests.find((row) => row.id === G3)?.token).toBe(KEPT);
    const first = guests.find((row) => row.id === G1)!.token;
    const second = guests.find((row) => row.id === G2)!.token;
    expect(first).not.toBe(OLD1);
    expect(second).not.toBe(OLD2);
    const jobs = (await client.query<{ guest_id: string; message: string }>("select guest_id, message from wa_job")).rows;
    expect(jobs.find((row) => row.guest_id === G1)?.message).toBe(`Buka https://contoh.id/${first}`);
    expect(jobs.find((row) => row.guest_id === G2)?.message).toBe(`Buka https://contoh.id/${OLD2}`);
  } finally { await client.close(); }
});
