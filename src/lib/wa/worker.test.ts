import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guest, user, waJob } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { addPhoto, deletePhoto } from "@/lib/photos/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { DEFAULT_WA_CONFIG, type WaConfig } from "./config";
import { claimNextJob, enqueueJobs, finishJob, sentLastDay } from "./queue";
import { processNext, type SendOutcome, type WaSender } from "./worker";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

const config: WaConfig = { ...DEFAULT_WA_CONFIG, aktif: true };

function sender(outcome: SendOutcome | Error, ready = true) {
  const sent: { phone: string; text: string }[] = [];
  const fake: WaSender = {
    ready: () => ready,
    send: async (phone, text) => {
      sent.push({ phone, text });
      if (outcome instanceof Error) throw outcome;
      return outcome;
    },
  };
  return { fake, sent };
}

async function seedJob(name: string, phone: string, existing?: { id: string }) {
  const invitation = existing ?? (await seedInvitation(db)).invitation;
  const events = await listEventDetails(db, invitation.id);
  const g = await createGuest(db, invitation.id, {
    name,
    phone,
    groupName: null,
    eventIds: [events[0].id],
    maxAttendees: 2,
  });
  await enqueueJobs(db, invitation.id, "undangan", [
    { guestId: g.id, phone: g.phone, message: `Halo ${name}` },
  ]);
  return { invitation, guest: g };
}

async function drain() {
  for (;;) {
    const job = await claimNextJob(db);
    if (!job) return;
    await finishJob(db, job, { skipped: "bersih" });
  }
}

describe("processNext dengan poster", () => {
  it("mengirim poster yang tersimpan bersama pesan dan tetap mengirim teks bila poster sudah dihapus", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const events = await listEventDetails(db, invitation.id);
    const bytes = Buffer.alloc(64, 9);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;
    const poster = await addPhoto(db, invitation.id, { kind: "poster_wa", fileName: "wa.jpg", bytes });
    if (!poster.ok) throw new Error("poster gagal");
    const g = await createGuest(db, invitation.id, { name: "Tamu Gambar", phone: "+6281600000099", groupName: null, eventIds: [events[0].id], maxAttendees: 2 });
    await enqueueJobs(db, invitation.id, "undangan", [{ guestId: g.id, phone: g.phone, message: "Halo Tamu Gambar", posterId: poster.photo.id }]);

    const diterima: { text: string; poster?: { data: Buffer; contentType: string } }[] = [];
    const pengirim: WaSender = { ready: () => true, send: async (_phone, text, gambar) => { diterima.push({ text, poster: gambar }); return { ok: true }; } };
    expect(await processNext(db, pengirim, config)).toBe("terkirim");
    expect(diterima[0].text).toBe("Halo Tamu Gambar");
    expect(diterima[0].poster?.data.equals(bytes)).toBe(true);
    expect(diterima[0].poster?.contentType).toBe("image/jpeg");

    const g2 = await createGuest(db, invitation.id, { name: "Tamu Dua", phone: "+6281600000098", groupName: null, eventIds: [events[0].id], maxAttendees: 2 });
    await enqueueJobs(db, invitation.id, "undangan", [{ guestId: g2.id, phone: g2.phone, message: "Halo Tamu Dua", posterId: poster.photo.id }]);
    await deletePhoto(db, invitation.id, poster.photo.id);
    expect(await processNext(db, pengirim, config)).toBe("terkirim");
    expect(diterima[1]).toEqual({ text: "Halo Tamu Dua", poster: undefined });
  });
});

describe("processNext", () => {
  it("menunda saat kirim otomatis dimatikan atau WhatsApp belum siap", async () => {
    await drain();
    await seedJob("Tamu A", "+6281600000001");
    const { fake, sent } = sender({ ok: true });

    expect(await processNext(db, fake, { ...config, aktif: false })).toBe("ditunda");
    expect(await processNext(db, sender({ ok: true }, false).fake, config)).toBe("ditunda");
    expect(sent).toHaveLength(0);
    await drain();
  });

  it("mengirim satu pesan per putaran dan menandai tamu terkirim", async () => {
    await drain();
    const first = await seedJob("Tamu B", "+6281600000011");
    await seedJob("Tamu C", "+6281600000012");
    const { fake, sent } = sender({ ok: true });

    expect(await processNext(db, fake, config)).toBe("terkirim");
    expect(sent).toEqual([{ phone: "+6281600000011", text: "Halo Tamu B" }]);
    const [row] = await db.select().from(guest).where(eq(guest.id, first.guest.id));
    expect(row.sentAt).not.toBeNull();

    expect(await processNext(db, fake, config)).toBe("terkirim");
    expect(await processNext(db, fake, config)).toBe("kosong");
    expect(sent).toHaveLength(2);
  });

  it("mencatat gagal dan tidak menandai tamu terkirim", async () => {
    await drain();
    const seeded = await seedJob("Tamu D", "+6281600000021");
    const { fake } = sender({ ok: false, error: "Nomor tidak terdaftar di WhatsApp" });

    expect(await processNext(db, fake, config)).toBe("gagal");
    const [row] = await db.select().from(guest).where(eq(guest.id, seeded.guest.id));
    expect(row.sentAt).toBeNull();
    const [job] = await db.select().from(waJob).where(eq(waJob.guestId, seeded.guest.id));
    expect(job.status).toBe("gagal");
    expect(job.error).toBe("Nomor tidak terdaftar di WhatsApp");
  });

  it("menangkap galat tak terduga dari pengirim sebagai gagal", async () => {
    await drain();
    const seeded = await seedJob("Tamu E", "+6281600000031");
    const { fake } = sender(new Error("Socket tertutup"));

    expect(await processNext(db, fake, config)).toBe("gagal");
    const [job] = await db.select().from(waJob).where(eq(waJob.guestId, seeded.guest.id));
    expect(job.error).toBe("Socket tertutup");
  });

  it("melewati tamu yang sudah ditandai terkirim secara manual", async () => {
    await drain();
    const seeded = await seedJob("Tamu F", "+6281600000041");
    await db.update(guest).set({ sentAt: new Date() }).where(eq(guest.id, seeded.guest.id));
    const { fake, sent } = sender({ ok: true });

    expect(await processNext(db, fake, config)).toBe("dilewati");
    expect(sent).toHaveLength(0);
  });

  it("berhenti saat batas harian tercapai", async () => {
    await drain();
    const first = await seedJob("Tamu G", "+6281600000051");
    const { fake, sent } = sender({ ok: true });

    const limited = { ...config, batasHarian: (await sentLastDay(db, first.invitation.id)) + 1 };

    expect(await processNext(db, fake, limited)).toBe("terkirim");
    await seedJob("Tamu H", "+6281600000052", first.invitation);
    expect(await processNext(db, fake, limited)).toBe("ditunda");
    expect(sent).toHaveLength(1);
    await drain();
  });
});

describe("processNext per nomor pengirim", () => {
  it("hanya memproses pesan miliknya dan memakai batas harian nomor itu", async () => {
    await drain();
    const { invitation, ownerId } = await seedInvitation(db);
    const lain = `nomor-lain-${ownerId}`;
    await db.insert(user).values({ id: lain, name: "Nomor Lain", email: `${lain}@example.com` });
    const events = await listEventDetails(db, invitation.id);
    const buatTamu = (nama: string, phone: string) => createGuest(db, invitation.id, { name: nama, phone, groupName: null, eventIds: [events[0].id], maxAttendees: 1 });
    const [a, b, c] = [await buatTamu("A", "+6281600000601"), await buatTamu("B", "+6281600000602"), await buatTamu("C", "+6281600000603")];
    await enqueueJobs(db, invitation.id, "undangan", [{ guestId: a.id, phone: a.phone, message: "untuk-saya-1", senderUserId: ownerId }, { guestId: c.id, phone: c.phone, message: "untuk-saya-2", senderUserId: ownerId }]);
    await enqueueJobs(db, invitation.id, "undangan", [{ guestId: b.id, phone: b.phone, message: "untuk-lain", senderUserId: lain }]);
    const { fake, sent } = sender({ ok: true });
    const batasSatu = { ...config, batasHarian: 1 };

    expect(await processNext(db, fake, batasSatu, new Date(), ownerId)).toBe("terkirim");
    expect(sent[0].text).toMatch(/^untuk-saya-/);
    expect(await processNext(db, fake, batasSatu, new Date(), ownerId)).toBe("ditunda");
    expect(await processNext(db, fake, batasSatu, new Date(), lain)).toBe("terkirim");
    expect(sent[1].text).toBe("untuk-lain");
    expect(await processNext(db, fake, config, new Date(), ownerId)).toBe("terkirim");
    expect(await processNext(db, fake, config, new Date(), ownerId)).toBe("kosong");
    expect(sent.map((s) => s.text).sort()).toEqual(["untuk-lain", "untuk-saya-1", "untuk-saya-2"]);
    await drain();
  });
});
