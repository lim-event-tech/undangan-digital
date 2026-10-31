import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guest, guestEvent, guestGroup, rsvp } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import type { RawRow } from "./import";
import {
  commitImport,
  countGuests,
  createGuest,
  deleteGuest,
  findPhoneConflict,
  getGuest,
  getImportContext,
  listEvents,
  listGroups,
  listGuests,
  updateGuest,
  type GuestInput,
} from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function fresh() {
  const { invitation } = await seedInvitation(db);
  const events = await listEvents(db, invitation.id);
  const akad = events.find((e) => e.key === "akad")!;
  const resepsi = events.find((e) => e.key === "resepsi")!;
  return { invitation, akad, resepsi };
}

function input(overrides: Partial<GuestInput> & Pick<GuestInput, "name" | "phone">): GuestInput {
  return {
    groupName: null,
    eventIds: [],
    maxAdults: 2,
    maxChildren: 0,
    ...overrides,
  };
}

function raw(row: number, nama: string, whatsapp: string, extra: Partial<RawRow> = {}): RawRow {
  return {
    row,
    nama,
    whatsapp,
    grup: "",
    acara: "",
    maks_dewasa: "",
    maks_anak: "",
    ...extra,
  };
}

describe("createGuest dan listGuests", () => {
  it("membuat tamu dengan token pribadi, grup otomatis, dan daftar acara", async () => {
    const { invitation, akad, resepsi } = await fresh();
    const created = await createGuest(
      db,
      invitation.id,
      input({
        name: "Ibu Sari",
        phone: "+6281200000101",
        groupName: "Keluarga wanita",
        eventIds: [akad.id, resepsi.id],
      }),
    );
    expect(created.token).toMatch(/^[A-Za-z0-9_-]{16}$/);

    const rows = await listGuests(db, invitation.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Ibu Sari",
      phone: "+6281200000101",
      groupName: "Keluarga wanita",
    });
    expect([...rows[0].eventIds].sort()).toEqual([akad.id, resepsi.id].sort());
  });

  it("memakai ulang grup yang sama tanpa membedakan huruf besar", async () => {
    const { invitation } = await fresh();
    await createGuest(db, invitation.id, input({ name: "A", phone: "+6281200000001", groupName: "Teman kantor" }));
    await createGuest(db, invitation.id, input({ name: "B", phone: "+6281200000002", groupName: "teman KANTOR" }));
    const groups = await listGroups(db, invitation.id);
    expect(groups.map((g) => g.name)).toEqual(["Teman kantor"]);
  });

  it("mencari menurut nama, nomor, grup, dan acara", async () => {
    const { invitation, akad, resepsi } = await fresh();
    await createGuest(db, invitation.id, input({ name: "Ibu Sari", phone: "+6281200000101", groupName: "Keluarga wanita", eventIds: [akad.id, resepsi.id] }));
    await createGuest(db, invitation.id, input({ name: "Kak Dimas", phone: "+6285700000103", groupName: "Teman kuliah", eventIds: [resepsi.id] }));

    const names = async (filters: Parameters<typeof listGuests>[2]) =>
      (await listGuests(db, invitation.id, filters)).map((g) => g.name);

    expect(await names({ q: "sari" })).toEqual(["Ibu Sari"]);
    expect(await names({ q: "0857" })).toEqual(["Kak Dimas"]);
    expect(await names({ q: "+62 857" })).toEqual(["Kak Dimas"]);

    const groups = await listGroups(db, invitation.id);
    const kuliah = groups.find((g) => g.name === "Teman kuliah")!;
    expect(await names({ groupId: kuliah.id })).toEqual(["Kak Dimas"]);
    expect(await names({ eventId: akad.id })).toEqual(["Ibu Sari"]);
    expect((await names({ eventId: resepsi.id })).sort()).toEqual(["Ibu Sari", "Kak Dimas"]);
    expect(await names({ q: "sari", groupId: kuliah.id })).toEqual([]);
  });

  it("memperlakukan % dan _ pada pencarian sebagai teks biasa", async () => {
    const { invitation } = await fresh();
    await createGuest(db, invitation.id, input({ name: "Ibu Sari", phone: "+6281200000101" }));
    expect(await listGuests(db, invitation.id, { q: "%" })).toEqual([]);
    expect(await listGuests(db, invitation.id, { q: "_" })).toEqual([]);
  });

  it("hanya menampilkan tamu milik undangan sendiri", async () => {
    const a = await fresh();
    const b = await fresh();
    await createGuest(db, a.invitation.id, input({ name: "Milik A", phone: "+6281200000101" }));
    await createGuest(db, b.invitation.id, input({ name: "Milik B", phone: "+6281200000102" }));
    expect((await listGuests(db, a.invitation.id)).map((g) => g.name)).toEqual(["Milik A"]);
    expect(await countGuests(db, b.invitation.id)).toBe(1);
  });

  it("membuang id acara milik undangan lain", async () => {
    const a = await fresh();
    const b = await fresh();
    const created = await createGuest(
      db,
      a.invitation.id,
      input({ name: "Tamu", phone: "+6281200000101", eventIds: [a.akad.id, b.akad.id] }),
    );
    const links = await db.select().from(guestEvent).where(eq(guestEvent.guestId, created.id));
    expect(links.map((l) => l.eventId)).toEqual([a.akad.id]);
  });

  it("menolak batas tamu yang tidak masuk akal di tingkat basis data", async () => {
    const { invitation } = await fresh();
    await expect(
      createGuest(db, invitation.id, input({ name: "X", phone: "+6281200000101", maxAdults: 0 })),
    ).rejects.toThrow();
  });
});

describe("updateGuest", () => {
  it("mengganti data, daftar acara, dan membuang RSVP untuk acara yang dicabut", async () => {
    const { invitation, akad, resepsi } = await fresh();
    const created = await createGuest(
      db,
      invitation.id,
      input({ name: "Ibu Sari", phone: "+6281200000101", eventIds: [akad.id, resepsi.id] }),
    );
    await db.insert(rsvp).values([
      { guestId: created.id, eventId: akad.id, attending: true, adults: 2 },
      { guestId: created.id, eventId: resepsi.id, attending: true, adults: 2 },
    ]);

    const updated = await updateGuest(
      db,
      invitation.id,
      created.id,
      input({
        name: "Ibu Sari R.",
        phone: "+6281300000999",
        groupName: "Keluarga wanita",
        eventIds: [resepsi.id],
        maxAdults: 3,
        maxChildren: 2,
      }),
    );
    expect(updated).toMatchObject({ name: "Ibu Sari R.", maxAdults: 3, maxChildren: 2 });
    expect(updated?.token).toBe(created.token);

    const after = await getGuest(db, invitation.id, created.id);
    expect(after).toMatchObject({ phone: "+6281300000999", groupName: "Keluarga wanita", eventIds: [resepsi.id] });
    const answers = await db.select().from(rsvp).where(eq(rsvp.guestId, created.id));
    expect(answers.map((r) => r.eventId)).toEqual([resepsi.id]);
  });

  it("mengembalikan null untuk tamu milik undangan lain", async () => {
    const a = await fresh();
    const b = await fresh();
    const created = await createGuest(db, a.invitation.id, input({ name: "Tamu A", phone: "+6281200000101" }));
    const result = await updateGuest(db, b.invitation.id, created.id, input({ name: "Diretas", phone: "+6281200000999" }));
    expect(result).toBeNull();
    const still = await getGuest(db, a.invitation.id, created.id);
    expect(still?.name).toBe("Tamu A");
  });
});

describe("deleteGuest", () => {
  it("menghapus tamu beserta relasinya", async () => {
    const { invitation, akad } = await fresh();
    const created = await createGuest(db, invitation.id, input({ name: "Tamu", phone: "+6281200000101", eventIds: [akad.id] }));
    expect(await deleteGuest(db, invitation.id, created.id)).toBe(true);
    expect(await getGuest(db, invitation.id, created.id)).toBeNull();
    const links = await db.select().from(guestEvent).where(eq(guestEvent.guestId, created.id));
    expect(links).toEqual([]);
  });

  it("tidak bisa menghapus tamu undangan lain", async () => {
    const a = await fresh();
    const b = await fresh();
    const created = await createGuest(db, a.invitation.id, input({ name: "Tamu A", phone: "+6281200000101" }));
    expect(await deleteGuest(db, b.invitation.id, created.id)).toBe(false);
    expect(await getGuest(db, a.invitation.id, created.id)).not.toBeNull();
  });
});

describe("findPhoneConflict", () => {
  it("menemukan tamu lain dengan nomor sama dan mengecualikan tamu yang sedang diubah", async () => {
    const { invitation } = await fresh();
    const created = await createGuest(db, invitation.id, input({ name: "Ibu Sari", phone: "+6281200000101" }));
    expect(await findPhoneConflict(db, invitation.id, "+6281200000101")).toEqual({ id: created.id, name: "Ibu Sari" });
    expect(await findPhoneConflict(db, invitation.id, "+6281200000101", created.id)).toBeNull();
    expect(await findPhoneConflict(db, invitation.id, "+6281200000555")).toBeNull();
  });
});

describe("commitImport", () => {
  it("menolak seluruh impor bila ada baris bermasalah tanpa persetujuan lewati", async () => {
    const { invitation } = await fresh();
    await createGuest(db, invitation.id, input({ name: "Ibu Sari", phone: "+6281200000101" }));

    const result = await commitImport(
      db,
      invitation.id,
      [
        raw(2, "Pak Budi", "0813-0000-0102"),
        raw(3, "Mas Fajar", "0812"),
        raw(4, "Sari Dobel", "0812-0000-0101"),
      ],
      false,
    );
    expect(result).toEqual({
      ok: false,
      error: "2 baris masih bermasalah. Perbaiki, atau pilih untuk melewati baris bermasalah.",
    });
    expect(await countGuests(db, invitation.id)).toBe(1);
  });

  it("mengimpor baris siap, melewati yang bermasalah, dan membuat grup sekali", async () => {
    const { invitation, akad, resepsi } = await fresh();
    await createGuest(db, invitation.id, input({ name: "Ibu Sari", phone: "+6281200000101" }));

    const result = await commitImport(
      db,
      invitation.id,
      [
        raw(2, "Pak Budi", "0813-0000-0102", { grup: "Teman SMA", acara: "akad;resepsi", maks_dewasa: "3", maks_anak: "1" }),
        raw(3, "Kak Nisa", "+62 857-0000-0112", { grup: "teman sma", acara: "resepsi" }),
        raw(4, "Mas Fajar", "0812"),
        raw(5, "Sari Dobel", "0812-0000-0101"),
      ],
      true,
    );
    expect(result).toEqual({ ok: true, imported: 2, skipped: 2 });
    expect(await countGuests(db, invitation.id)).toBe(3);

    const groups = await listGroups(db, invitation.id);
    expect(groups.map((g) => g.name)).toEqual(["Teman SMA"]);

    const rows = await listGuests(db, invitation.id);
    const budi = rows.find((g) => g.name === "Pak Budi")!;
    const nisa = rows.find((g) => g.name === "Kak Nisa")!;
    expect(budi).toMatchObject({ phone: "+6281300000102", groupName: "Teman SMA", maxAdults: 3, maxChildren: 1 });
    expect([...budi.eventIds].sort()).toEqual([akad.id, resepsi.id].sort());
    expect(nisa).toMatchObject({ phone: "+6285700000112", groupName: "Teman SMA", maxAdults: 2, maxChildren: 0 });
    expect(nisa.eventIds).toEqual([resepsi.id]);
  });

  it("memakai semua acara bila kolom acara kosong", async () => {
    const { invitation, akad, resepsi } = await fresh();
    const result = await commitImport(db, invitation.id, [raw(2, "Tante Lina", "81200000104")], false);
    expect(result).toMatchObject({ ok: true, imported: 1 });
    const [row] = await listGuests(db, invitation.id);
    expect([...row.eventIds].sort()).toEqual([akad.id, resepsi.id].sort());
  });

  it("memvalidasi ulang di server walau klien mengirim data tak layak", async () => {
    const { invitation } = await fresh();
    const result = await commitImport(
      db,
      invitation.id,
      [raw(2, "", "bukan nomor"), raw(3, "Pak Budi", "0813-0000-0102", { acara: "acara-palsu" })],
      true,
    );
    expect(result).toEqual({ ok: false, error: "Tidak ada baris yang siap diimpor." });
    expect(await countGuests(db, invitation.id)).toBe(0);
  });

  it("menangani impor besar dalam beberapa potongan dengan token unik", async () => {
    const { invitation } = await fresh();
    const rows = Array.from({ length: 650 }, (_, i) =>
      raw(i + 2, `Tamu ${i + 1}`, `081200${String(i).padStart(5, "0")}`, { grup: i % 2 === 0 ? "Genap" : "Ganjil" }),
    );
    const result = await commitImport(db, invitation.id, rows, false);
    expect(result).toEqual({ ok: true, imported: 650, skipped: 0 });

    const stored = await db.select({ token: guest.token }).from(guest).where(eq(guest.invitationId, invitation.id));
    expect(new Set(stored.map((r) => r.token)).size).toBe(650);
    const groups = await db.select().from(guestGroup).where(eq(guestGroup.invitationId, invitation.id));
    expect(groups.map((g) => g.name).sort()).toEqual(["Ganjil", "Genap"]);
    const links = await db.select().from(guestEvent);
    expect(links.length).toBeGreaterThanOrEqual(1300);
  });

  it("tidak membuat apa pun bila penyimpanan gagal di tengah jalan", async () => {
    const { invitation } = await fresh();
    const rows = [raw(2, "Pak Budi", "0813-0000-0102", { grup: "Baru" }), raw(3, "Kak Nisa", "0857-0000-0112")];
    const original = db.transaction.bind(db);
    let failed = false;
    const broken = new Proxy(db, {
      get(target, prop, receiver) {
        if (prop === "transaction") {
          return async (callback: Parameters<typeof original>[0]) =>
            original(async (tx) => {
              await callback(tx);
              failed = true;
              throw new Error("gagal sengaja");
            });
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as TestDb;

    await expect(commitImport(broken, invitation.id, rows, false)).rejects.toThrow("gagal sengaja");
    expect(failed).toBe(true);
    expect(await countGuests(db, invitation.id)).toBe(0);
    expect(await listGroups(db, invitation.id)).toEqual([]);
  });
});

describe("getImportContext", () => {
  it("mengumpulkan acara, grup, tamu yang ada, dan bawaan undangan", async () => {
    const { invitation, akad, resepsi } = await fresh();
    await createGuest(db, invitation.id, input({ name: "Ibu Sari", phone: "+6281200000101", groupName: "Keluarga" }));
    const context = await getImportContext(db, invitation.id);
    expect(context.events.map((e) => e.id)).toEqual([akad.id, resepsi.id]);
    expect(context.groups).toEqual(["Keluarga"]);
    expect(context.existing).toEqual([{ name: "Ibu Sari", phone: "+6281200000101" }]);
    expect(context.defaults).toEqual({ maxAdults: 2, maxChildren: 0 });
  });
});
