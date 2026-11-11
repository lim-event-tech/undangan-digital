import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { waJob } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { saveContentText } from "@/lib/invitations/editor";
import { addPhoto } from "@/lib/photos/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { queueBlast, pickTargets, type TargetGuest } from "./blast";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

const now = new Date("2026-11-03T10:00:00.000Z");

function tamu(id: string, patch: Partial<TargetGuest> = {}): TargetGuest {
  return {
    id,
    name: `Tamu ${id}`,
    phone: "+6281700000000",
    token: "token",
    sentAt: null,
    remindedAt: null,
    answered: false,
    ...patch,
  };
}

describe("pickTargets undangan", () => {
  it("hanya tamu yang belum dikirimi dan belum antre", () => {
    const guests = [
      tamu("a"),
      tamu("b", { sentAt: new Date("2026-11-01T00:00:00.000Z") }),
      tamu("c"),
    ];
    const result = pickTargets("undangan", guests, new Set(["c"]), now);
    expect(result.map((g) => g.id)).toEqual(["a"]);
  });
});

describe("pickTargets pengingat", () => {
  const sent = new Date("2026-11-01T00:00:00.000Z");

  it("hanya tamu yang sudah dikirimi undangan dan belum menjawab", () => {
    const guests = [
      tamu("a", { sentAt: sent }),
      tamu("b"),
      tamu("c", { sentAt: sent, answered: true }),
    ];
    expect(pickTargets("pengingat", guests, new Set(), now).map((g) => g.id)).toEqual(["a"]);
  });

  it("melewati tamu yang baru diingatkan dalam 24 jam terakhir", () => {
    const guests = [
      tamu("a", { sentAt: sent, remindedAt: new Date("2026-11-03T02:00:00.000Z") }),
      tamu("b", { sentAt: sent, remindedAt: new Date("2026-11-02T09:00:00.000Z") }),
    ];
    expect(pickTargets("pengingat", guests, new Set(), now).map((g) => g.id)).toEqual(["b"]);
  });
});

describe("queueBlast", () => {
  it("menolak saat undangan belum terbit", async () => {
    const { invitation } = await seedInvitation(db);
    const result = await queueBlast(db, { ...invitation, status: "draf" }, "undangan", now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("belum terbit");
  });

  it("menolak saat tidak ada tamu yang perlu dikirimi", async () => {
    const { invitation } = await seedInvitation(db);
    const result = await queueBlast(db, { ...invitation, status: "terbit" }, "undangan", now);
    expect(result).toEqual({ ok: false, error: "Tidak ada tamu yang perlu dikirimi." });
  });
});

function jpeg(isi: number): Buffer {
  const bytes = Buffer.alloc(64, isi);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

async function siapkan(phone: string) {
  const { invitation } = await seedInvitation(db);
  const events = await listEventDetails(db, invitation.id);
  const tamuBaru = await createGuest(db, invitation.id, { name: "Tamu Poster", phone, groupName: null, eventIds: [events[0].id], maxAttendees: 2 });
  return { invitation: { ...invitation, status: "terbit" as const }, tamuBaru };
}

describe("queueBlast dengan poster", () => {
  it("memakai poster dari Isi undangan bila dipilih dan menolak bila belum ada", async () => {
    const { invitation, tamuBaru } = await siapkan("+6281700000101");
    await saveContentText(db, invitation.id, { waPoster: { kirim: true, sumber: "sama" } });
    const dipilih = { ...invitation, content: { ...(invitation.content as object), waPoster: { kirim: true, sumber: "sama" } } };
    const tanpa = await queueBlast(db, dipilih, "undangan", now);
    expect(tanpa).toMatchObject({ ok: false });
    if (!tanpa.ok) expect(tanpa.error).toContain("Poster di Isi undangan belum diunggah");

    const poster = await addPhoto(db, invitation.id, { kind: "cover", fileName: "poster.jpg", bytes: jpeg(1) });
    if (!poster.ok) throw new Error("poster gagal");
    expect(await queueBlast(db, dipilih, "undangan", now)).toEqual({ ok: true, added: 1 });
    const [job] = await db.select().from(waJob).where(eq(waJob.guestId, tamuBaru.id));
    expect(job.posterId).toBe(poster.photo.id);
  });

  it("memakai poster khusus WhatsApp, bukan poster Isi undangan, bila dipilih", async () => {
    const { invitation, tamuBaru } = await siapkan("+6281700000102");
    await addPhoto(db, invitation.id, { kind: "cover", fileName: "poster.jpg", bytes: jpeg(1) });
    const khusus = { ...invitation, content: { waPoster: { kirim: true, sumber: "khusus" } } };
    const tanpa = await queueBlast(db, khusus, "undangan", now);
    expect(tanpa).toMatchObject({ ok: false });
    if (!tanpa.ok) expect(tanpa.error).toContain("Poster khusus WhatsApp belum diunggah");

    const wa = await addPhoto(db, invitation.id, { kind: "poster_wa", fileName: "wa.jpg", bytes: jpeg(2) });
    if (!wa.ok) throw new Error("poster wa gagal");
    expect(await queueBlast(db, khusus, "undangan", now)).toEqual({ ok: true, added: 1 });
    const [job] = await db.select().from(waJob).where(eq(waJob.guestId, tamuBaru.id));
    expect(job.posterId).toBe(wa.photo.id);
  });

  it("tidak melampirkan poster bila dimatikan", async () => {
    const { invitation, tamuBaru } = await siapkan("+6281700000103");
    await addPhoto(db, invitation.id, { kind: "cover", fileName: "poster.jpg", bytes: jpeg(1) });
    expect(await queueBlast(db, { ...invitation, content: { waPoster: { kirim: false, sumber: "sama" } } }, "undangan", now)).toEqual({ ok: true, added: 1 });
    const [job] = await db.select().from(waJob).where(eq(waJob.guestId, tamuBaru.id));
    expect(job.posterId).toBeNull();
  });
});
