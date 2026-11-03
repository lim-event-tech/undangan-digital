import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { event, guest, guestGroup, invitation, photo } from "@/db/schema";
import { listEventDetails, updateEvent } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { addPhoto } from "@/lib/photos/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { DEFAULT_SUSUNAN, readContent } from "./content";
import {
  deleteInvitation,
  getMissingForPublish,
  publishInvitation,
  saveContentText,
  saveMempelai,
  saveRsvpSettings,
  unpublishInvitation,
} from "./editor";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

function jpeg(): Buffer {
  const bytes = Buffer.alloc(64, 7);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

async function lengkapi(invitationId: string) {
  await addPhoto(db, invitationId, { kind: "cover", fileName: "cover.jpg", bytes: jpeg() });
  for (const e of await listEventDetails(db, invitationId)) {
    await updateEvent(db, invitationId, e.id, {
      name: e.name,
      date: "2026-12-20",
      time: "09:00",
      timezone: "WIB",
      venueName: null,
      address: null,
      mapsUrl: "https://maps.app.goo.gl/AbC123",
    });
  }
}

async function statusOf(invitationId: string) {
  const [row] = await db
    .select({ status: invitation.status })
    .from(invitation)
    .where(eq(invitation.id, invitationId));
  return row.status;
}

describe("getMissingForPublish", () => {
  it("menyebut foto cover serta tanggal, jam, dan link Maps tiap acara", async () => {
    const { invitation: created } = await seedInvitation(db);
    const missing = await getMissingForPublish(db, created.id);
    expect(missing.map((m) => m.label)).toEqual([
      "Foto cover",
      "Tanggal Akad Nikah",
      "Jam Akad Nikah",
      "Link Maps Akad Nikah",
      "Tanggal Resepsi",
      "Jam Resepsi",
      "Link Maps Resepsi",
    ]);
    expect(missing[0].anchor).toBe("sampul");
    expect(missing[1].anchor).toMatch(/^acara-[0-9a-f-]{36}$/);
  });

  it("kosong setelah semua field wajib terisi", async () => {
    const { invitation: created } = await seedInvitation(db);
    await lengkapi(created.id);
    expect(await getMissingForPublish(db, created.id)).toEqual([]);
  });
});

describe("publishInvitation", () => {
  it("menolak terbit selama field wajib belum lengkap", async () => {
    const { invitation: created } = await seedInvitation(db);
    const result = await publishInvitation(db, created.id);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "belum-lengkap") {
      expect(result.missing.length).toBeGreaterThan(0);
    } else {
      throw new Error("alasan penolakan salah");
    }
    expect(await statusOf(created.id)).toBe("draf");
  });

  it("menerbitkan undangan yang lengkap, lalu bisa ditarik kembali ke draf", async () => {
    const { invitation: created } = await seedInvitation(db);
    await lengkapi(created.id);
    expect(await publishInvitation(db, created.id)).toEqual({ ok: true });
    expect(await statusOf(created.id)).toBe("terbit");

    expect(await unpublishInvitation(db, created.id)).toBe(true);
    expect(await statusOf(created.id)).toBe("draf");
    expect(await unpublishInvitation(db, created.id)).toBe(false);
  });

  it("tidak membiarkan pemilik membuka undangan yang ditangguhkan admin", async () => {
    const { invitation: created } = await seedInvitation(db);
    await lengkapi(created.id);
    await db.update(invitation).set({ status: "ditangguhkan" }).where(eq(invitation.id, created.id));

    expect(await publishInvitation(db, created.id)).toEqual({ ok: false, reason: "ditangguhkan" });
    expect(await unpublishInvitation(db, created.id)).toBe(false);
    expect(await statusOf(created.id)).toBe("ditangguhkan");
  });

  it("memberi alasan tidak-ada untuk undangan yang tidak ditemukan", async () => {
    expect(await publishInvitation(db, "00000000-0000-4000-8000-000000000000")).toEqual({
      ok: false,
      reason: "tidak-ada",
    });
  });
});

describe("konten undangan", () => {
  it("menyimpan nama dan data mempelai tanpa menimpa teks sambutan", async () => {
    const { invitation: created } = await seedInvitation(db, { groom: "Raka", bride: "Nadia" });
    await saveContentText(db, created.id, { kutipan: "Dan di antara tanda-tanda-Nya", sambutan: "Selamat datang" });
    await saveMempelai(db, created.id, {
      groomName: "Rakai",
      brideName: "Nadia",
      pria: { namaLengkap: "Raka Pratama", orangTua: "Putra Bapak A dan Ibu B" },
      wanita: { namaLengkap: "Nadia Putri", orangTua: "Putri Bapak C dan Ibu D" },
    });

    const [row] = await db.select().from(invitation).where(eq(invitation.id, created.id));
    expect(row.groomName).toBe("Rakai");
    expect(row.slug).toBe("raka-dan-nadia");
    expect(readContent(row.content)).toEqual({
      kutipan: "Dan di antara tanda-tanda-Nya",
      sambutan: "Selamat datang",
      penutup: "",
      pesanWa: "",
      pesanPengingat: "",
      amplop: [],
      cerita: [],
      ucapan: { tampil: true, tahan: false },
      hitungMundur: { aktif: true, detik: true },
      musik: { aktif: false },
      susunan: DEFAULT_SUSUNAN,
      pria: { namaLengkap: "Raka Pratama", orangTua: "Putra Bapak A dan Ibu B" },
      wanita: { namaLengkap: "Nadia Putri", orangTua: "Putri Bapak C dan Ibu D" },
    });
  });

  it("memperbarui satu bagian teks tanpa menghapus bagian lain", async () => {
    const { invitation: created } = await seedInvitation(db);
    await saveContentText(db, created.id, { kutipan: "Kutipan", sambutan: "Sambutan" });
    await saveContentText(db, created.id, { penutup: "Terima kasih" });
    await saveContentText(db, created.id, { sambutan: "Sambutan baru" });

    const [row] = await db.select().from(invitation).where(eq(invitation.id, created.id));
    expect(readContent(row.content)).toMatchObject({
      kutipan: "Kutipan",
      sambutan: "Sambutan baru",
      penutup: "Terima kasih",
    });
  });

  it("menyimpan batas waktu RSVP dan bawaan jumlah tamu", async () => {
    const { invitation: created } = await seedInvitation(db);
    const deadline = new Date("2026-12-10T16:59:59.000Z");
    await saveRsvpSettings(db, created.id, { deadline, maxAdults: 3, maxChildren: 2 });

    const [row] = await db.select().from(invitation).where(eq(invitation.id, created.id));
    expect(row.rsvpDeadline?.toISOString()).toBe(deadline.toISOString());
    expect(row.defaultMaxAdults).toBe(3);
    expect(row.defaultMaxChildren).toBe(2);

    await saveRsvpSettings(db, created.id, { deadline: null, maxAdults: 2, maxChildren: 0 });
    const [cleared] = await db.select().from(invitation).where(eq(invitation.id, created.id));
    expect(cleared.rsvpDeadline).toBeNull();
  });
});

describe("readContent", () => {
  it("memberi nilai kosong untuk data yang rusak atau tidak ada", () => {
    const empty = {
      kutipan: "",
      sambutan: "",
      penutup: "",
      pesanWa: "",
      pesanPengingat: "",
      amplop: [],
      cerita: [],
      ucapan: { tampil: true, tahan: false },
      hitungMundur: { aktif: true, detik: true },
      musik: { aktif: false },
      susunan: DEFAULT_SUSUNAN,
      pria: { namaLengkap: "", orangTua: "" },
      wanita: { namaLengkap: "", orangTua: "" },
    };
    expect(readContent({})).toEqual(empty);
    expect(readContent(null)).toEqual(empty);
    expect(readContent([1, 2])).toEqual(empty);
    expect(readContent({ kutipan: 5, pria: "x", wanita: [] })).toEqual(empty);
  });
});

describe("deleteInvitation", () => {
  it("menghapus undangan beserta tamu, grup, acara, dan foto", async () => {
    const { ownerId, invitation: created } = await seedInvitation(db);
    const events = await listEventDetails(db, created.id);
    await createGuest(db, created.id, {
      name: "Bapak Hendra",
      phone: "+6281200000001",
      groupName: "Keluarga",
      eventIds: events.map((e) => e.id),
      maxAdults: 2,
      maxChildren: 0,
    });
    await addPhoto(db, created.id, { kind: "cover", fileName: "cover.jpg", bytes: jpeg() });

    expect(await deleteInvitation(db, created.id, ownerId)).toBe(true);

    expect(await db.select().from(invitation).where(eq(invitation.id, created.id))).toEqual([]);
    expect(await db.select().from(guest).where(eq(guest.invitationId, created.id))).toEqual([]);
    expect(await db.select().from(guestGroup).where(eq(guestGroup.invitationId, created.id))).toEqual([]);
    expect(await db.select().from(event).where(eq(event.invitationId, created.id))).toEqual([]);
    expect(await db.select().from(photo).where(eq(photo.invitationId, created.id))).toEqual([]);
  });

  it("tidak menghapus undangan milik orang lain dan tidak menyentuh tamunya", async () => {
    const owner = await seedInvitation(db);
    const intruder = await seedInvitation(db);
    const events = await listEventDetails(db, owner.invitation.id);
    await createGuest(db, owner.invitation.id, {
      name: "Ibu Sari",
      phone: "+6281200000002",
      groupName: null,
      eventIds: [events[0].id],
      maxAdults: 2,
      maxChildren: 0,
    });

    expect(await deleteInvitation(db, owner.invitation.id, intruder.ownerId)).toBe(false);
    expect(await db.select().from(guest).where(eq(guest.invitationId, owner.invitation.id))).toHaveLength(1);
  });
});
