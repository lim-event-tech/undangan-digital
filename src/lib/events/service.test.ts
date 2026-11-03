import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guestEvent, rsvp } from "@/db/schema";
import { createGuest } from "@/lib/guests/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { MAX_EVENTS, type EventInput } from "./form";
import {
  createEvent,
  deleteEvent,
  listEventDetails,
  makeEventKey,
  updateEvent,
} from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

const input: EventInput = {
  name: "Akad Nikah",
  date: "2026-12-20",
  time: "09:30",
  timezone: "WITA",
  venueName: "Gedung Serbaguna",
  address: "Jl. Melati No. 1",
  mapsUrl: "https://maps.app.goo.gl/AbC123",
};

describe("makeEventKey", () => {
  it("membuat kunci huruf kecil tanpa aksen dan tanda baca", () => {
    expect(makeEventKey("Ngunduh Mantu")).toBe("ngunduh-mantu");
    expect(makeEventKey("Pemberkatan & Sungkeman!")).toBe("pemberkatan-sungkeman");
    expect(makeEventKey("Résepsi Malam")).toBe("resepsi-malam");
  });

  it("memakai kunci cadangan bila nama tidak punya huruf atau angka", () => {
    expect(makeEventKey("!!!")).toBe("acara");
  });

  it("membatasi panjang kunci", () => {
    expect(makeEventKey("A".repeat(80)).length).toBeLessThanOrEqual(30);
  });
});

describe("createEvent", () => {
  it("menambah acara berikutnya dengan urutan baru dan kunci unik", async () => {
    const { invitation } = await seedInvitation(db);
    const first = await createEvent(db, invitation.id, "Ngunduh Mantu");
    const second = await createEvent(db, invitation.id, "Ngunduh Mantu");
    expect(first.ok && first.event.key).toBe("ngunduh-mantu");
    expect(second.ok && second.event.key).toBe("ngunduh-mantu-2");
    expect(first.ok && first.event.sortOrder).toBe(2);
    expect(second.ok && second.event.sortOrder).toBe(3);

    const all = await listEventDetails(db, invitation.id);
    expect(all.map((e) => e.name)).toEqual([
      "Akad Nikah",
      "Resepsi",
      "Ngunduh Mantu",
      "Ngunduh Mantu",
    ]);
  });

  it("menolak acara baru setelah batas jumlah acara tercapai", async () => {
    const { invitation } = await seedInvitation(db);
    for (let i = 2; i < MAX_EVENTS; i++) {
      const created = await createEvent(db, invitation.id, `Acara ${i}`);
      expect(created.ok).toBe(true);
    }
    expect(await createEvent(db, invitation.id, "Kelebihan")).toEqual({
      ok: false,
      error: "penuh",
    });
    expect(await listEventDetails(db, invitation.id)).toHaveLength(MAX_EVENTS);
  });
});

describe("updateEvent", () => {
  it("menyimpan tanggal, jam, zona, tempat, alamat, dan link Maps", async () => {
    const { invitation } = await seedInvitation(db);
    const [akad] = await listEventDetails(db, invitation.id);
    const updated = await updateEvent(db, invitation.id, akad.id, input);
    expect(updated).toMatchObject({
      name: "Akad Nikah",
      date: "2026-12-20",
      time: "09:30",
      timezone: "WITA",
      venueName: "Gedung Serbaguna",
      address: "Jl. Melati No. 1",
      mapsUrl: "https://maps.app.goo.gl/AbC123",
    });
    expect((await listEventDetails(db, invitation.id))[0]).toEqual(updated);
  });

  it("mengosongkan kembali field opsional", async () => {
    const { invitation } = await seedInvitation(db);
    const [akad] = await listEventDetails(db, invitation.id);
    await updateEvent(db, invitation.id, akad.id, input);
    const cleared = await updateEvent(db, invitation.id, akad.id, {
      ...input,
      date: null,
      time: null,
      venueName: null,
      address: null,
      mapsUrl: null,
    });
    expect(cleared).toMatchObject({
      date: null,
      time: null,
      venueName: null,
      address: null,
      mapsUrl: null,
    });
  });

  it("tidak mengubah acara milik undangan lain", async () => {
    const owner = await seedInvitation(db);
    const other = await seedInvitation(db);
    const [akad] = await listEventDetails(db, owner.invitation.id);
    expect(await updateEvent(db, other.invitation.id, akad.id, input)).toBeNull();
    expect((await listEventDetails(db, owner.invitation.id))[0].date).toBeNull();
  });
});

describe("deleteEvent", () => {
  it("menghapus acara beserta tautan tamu dan jawaban RSVP-nya", async () => {
    const { invitation } = await seedInvitation(db);
    const [akad, resepsi] = await listEventDetails(db, invitation.id);
    const guest = await createGuest(db, invitation.id, {
      name: "Bapak Hendra",
      phone: "+6281200000001",
      groupName: null,
      eventIds: [akad.id, resepsi.id],
      maxAdults: 2,
      maxChildren: 0,
    });
    await db
      .insert(rsvp)
      .values({ guestId: guest.id, eventId: akad.id, attending: true, adults: 2 });

    expect(await deleteEvent(db, invitation.id, akad.id)).toBe("dihapus");

    const links = await db.select().from(guestEvent).where(eq(guestEvent.guestId, guest.id));
    expect(links.map((l) => l.eventId)).toEqual([resepsi.id]);
    expect(await db.select().from(rsvp).where(eq(rsvp.guestId, guest.id))).toEqual([]);
  });

  it("tidak menghapus acara terakhir", async () => {
    const { invitation } = await seedInvitation(db);
    const [akad, resepsi] = await listEventDetails(db, invitation.id);
    expect(await deleteEvent(db, invitation.id, akad.id)).toBe("dihapus");
    expect(await deleteEvent(db, invitation.id, resepsi.id)).toBe("terakhir");
    expect(await listEventDetails(db, invitation.id)).toHaveLength(1);
  });

  it("tidak menyentuh acara milik undangan lain", async () => {
    const owner = await seedInvitation(db);
    const other = await seedInvitation(db);
    const [akad] = await listEventDetails(db, owner.invitation.id);
    expect(await deleteEvent(db, other.invitation.id, akad.id)).toBe("tidak-ada");
    expect(await listEventDetails(db, owner.invitation.id)).toHaveLength(2);
  });
});
