import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guest, user, waJob } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import {
  cancelPending,
  hasWaitingJobs,
  senderSentLastDay,
  senderSummary,
  claimNextJob,
  enqueueJobs,
  finishJob,
  invitationSummary,
  invitationsAtLimit,
  isAlreadyHandled,
  queuedGuestIds,
  recentFailures,
  recoverInterrupted,
  sentLastDay,
} from "./queue";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function newGuest(invitationId: string, name: string, phone: string) {
  const events = await listEventDetails(db, invitationId);
  return createGuest(db, invitationId, {
    name,
    phone,
    groupName: null,
    eventIds: [events[0].id],
    maxAttendees: 2,
  });
}

async function guestRow(id: string) {
  const [row] = await db.select().from(guest).where(eq(guest.id, id));
  return row;
}

async function drain() {
  for (;;) {
    const job = await claimNextJob(db);
    if (!job) return;
    await finishJob(db, job, { skipped: "bersih" });
  }
}

describe("antrean WhatsApp", () => {
  it("memasukkan pesan dan mengabaikan tamu yang sudah antre untuk jenis yang sama", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu A", "+6281500000001");
    const job = { guestId: g.id, phone: g.phone, message: "Halo" };

    expect(await enqueueJobs(db, invitation.id, "undangan", [job])).toBe(1);
    expect(await enqueueJobs(db, invitation.id, "undangan", [job])).toBe(0);
    expect(await enqueueJobs(db, invitation.id, "pengingat", [job])).toBe(1);
    expect((await queuedGuestIds(db, invitation.id, "undangan")).has(g.id)).toBe(true);
  });

  it("mengambil pesan menurut urutan masuk dan menandai terkirim ke tamu", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const a = await newGuest(invitation.id, "Tamu A", "+6281500000011");
    const b = await newGuest(invitation.id, "Tamu B", "+6281500000012");
    await enqueueJobs(db, invitation.id, "undangan", [
      { guestId: a.id, phone: a.phone, message: "A" },
    ]);
    await enqueueJobs(db, invitation.id, "undangan", [
      { guestId: b.id, phone: b.phone, message: "B" },
    ]);

    const first = await claimNextJob(db);
    expect(first?.message).toBe("A");
    const at = new Date("2026-11-03T05:00:00.000Z");
    await finishJob(db, first!, { ok: true }, at);
    expect((await guestRow(a.id)).sentAt?.toISOString()).toBe(at.toISOString());

    const second = await claimNextJob(db);
    expect(second?.message).toBe("B");
    expect(await claimNextJob(db)).toBeNull();
    await finishJob(db, second!, { ok: false, error: "Nomor tidak terdaftar di WhatsApp" });
    expect((await guestRow(b.id)).sentAt).toBeNull();

    const failures = await recentFailures(db, { invitationId: invitation.id });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      guestName: "Tamu B",
      error: "Nomor tidak terdaftar di WhatsApp",
    });
  });

  it("pengingat menandai waktu diingatkan, bukan waktu kirim", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu R", "+6281500000021");
    await enqueueJobs(db, invitation.id, "pengingat", [
      { guestId: g.id, phone: g.phone, message: "Ingat" },
    ]);
    const job = await claimNextJob(db);
    await finishJob(db, job!, { ok: true });
    const row = await guestRow(g.id);
    expect(row.lastRemindedAt).not.toBeNull();
    expect(row.sentAt).toBeNull();
  });

  it("boleh dimasukkan lagi setelah gagal", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu G", "+6281500000031");
    const input = [{ guestId: g.id, phone: g.phone, message: "Halo" }];
    await enqueueJobs(db, invitation.id, "undangan", input);
    const job = await claimNextJob(db);
    await finishJob(db, job!, { ok: false, error: "gagal" });
    expect(await enqueueJobs(db, invitation.id, "undangan", input)).toBe(1);
  });

  it("membatalkan hanya pesan yang masih menunggu", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const a = await newGuest(invitation.id, "Tamu A", "+6281500000041");
    const b = await newGuest(invitation.id, "Tamu B", "+6281500000042");
    await enqueueJobs(db, invitation.id, "undangan", [
      { guestId: a.id, phone: a.phone, message: "A" },
      { guestId: b.id, phone: b.phone, message: "B" },
    ]);
    const sending = await claimNextJob(db);
    expect(await cancelPending(db, invitation.id)).toBe(1);
    const [row] = await db.select().from(waJob).where(eq(waJob.id, sending!.id));
    expect(row.status).toBe("mengirim");
    await finishJob(db, sending!, { ok: true });
  });

  it("menandai pesan yang terputus saat dikirim sebagai gagal setelah restart", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu P", "+6281500000051");
    await enqueueJobs(db, invitation.id, "undangan", [
      { guestId: g.id, phone: g.phone, message: "P" },
    ]);
    const job = await claimNextJob(db);
    expect(await recoverInterrupted(db)).toBe(1);
    const [row] = await db.select().from(waJob).where(eq(waJob.id, job!.id));
    expect(row.status).toBe("gagal");
    expect(row.error).toContain("Terputus");
  });

  it("mengenali tamu yang sudah ditandai terkirim secara manual", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu M", "+6281500000061");
    await enqueueJobs(db, invitation.id, "undangan", [
      { guestId: g.id, phone: g.phone, message: "M" },
    ]);
    const job = await claimNextJob(db);
    expect(await isAlreadyHandled(db, job!)).toBe(false);
    await db.update(guest).set({ sentAt: new Date() }).where(eq(guest.id, g.id));
    expect(await isAlreadyHandled(db, job!)).toBe(true);
  });

  it("menghitung ringkasan dan pesan terkirim dalam 24 jam", async () => {
    await drain();
    const { invitation } = await seedInvitation(db);
    const a = await newGuest(invitation.id, "Tamu A", "+6281500000071");
    const b = await newGuest(invitation.id, "Tamu B", "+6281500000072");
    await enqueueJobs(db, invitation.id, "undangan", [
      { guestId: a.id, phone: a.phone, message: "A" },
      { guestId: b.id, phone: b.phone, message: "B" },
    ]);
    const job = await claimNextJob(db);
    await finishJob(db, job!, { ok: true });

    expect(await invitationSummary(db, invitation.id)).toEqual({
      menunggu: 1,
      mengirim: 0,
      terkirim: 1,
      gagal: 0,
    });
    expect(await sentLastDay(db, invitation.id)).toBe(1);
    expect(await sentLastDay(db, invitation.id, new Date(Date.now() + 25 * 60 * 60 * 1000))).toBe(0);
  });

  it("menghitung kuota per pasangan dan mengenali pasangan yang sudah penuh", async () => {
    await drain();
    const penuh = await seedInvitation(db);
    const lain = await seedInvitation(db);
    const a = await newGuest(penuh.invitation.id, "Tamu A", "+6281500000081");
    const b = await newGuest(penuh.invitation.id, "Tamu B", "+6281500000082");
    const c = await newGuest(lain.invitation.id, "Tamu C", "+6281500000083");
    await enqueueJobs(db, penuh.invitation.id, "undangan", [
      { guestId: a.id, phone: a.phone, message: "A" },
      { guestId: b.id, phone: b.phone, message: "B" },
    ]);
    await enqueueJobs(db, lain.invitation.id, "undangan", [
      { guestId: c.id, phone: c.phone, message: "C" },
    ]);
    await finishJob(db, (await claimNextJob(db))!, { ok: true });
    await finishJob(db, (await claimNextJob(db))!, { ok: true });
    await finishJob(db, (await claimNextJob(db))!, { ok: true });

    expect(await sentLastDay(db, penuh.invitation.id)).toBe(2);
    expect(await sentLastDay(db, lain.invitation.id)).toBe(1);
    const atLimit = await invitationsAtLimit(db, 2);
    expect(atLimit).toContain(penuh.invitation.id);
    expect(atLimit).not.toContain(lain.invitation.id);
  });

  it("melewati pasangan yang dikecualikan saat mengambil pesan berikutnya", async () => {
    await drain();
    const x = await seedInvitation(db);
    const y = await seedInvitation(db);
    const gx = await newGuest(x.invitation.id, "Tamu X", "+6281500000091");
    const gy = await newGuest(y.invitation.id, "Tamu Y", "+6281500000092");
    await enqueueJobs(db, x.invitation.id, "undangan", [
      { guestId: gx.id, phone: gx.phone, message: "X" },
    ]);
    await enqueueJobs(db, y.invitation.id, "undangan", [
      { guestId: gy.id, phone: gy.phone, message: "Y" },
    ]);
    const job = await claimNextJob(db, [x.invitation.id]);
    expect(job?.message).toBe("Y");
    expect(await claimNextJob(db, [x.invitation.id])).toBeNull();
    await finishJob(db, job!, { ok: true });
  });
});

describe("antrean per nomor pengirim", () => {
  async function dua(namaA: string, namaB: string) {
    const { invitation, ownerId } = await seedInvitation(db);
    const pengirimB = `pengirim-b-${ownerId}`;
    await db.insert(user).values({ id: pengirimB, name: "Pengirim B", email: `${pengirimB}@example.com` });
    const a = await newGuest(invitation.id, namaA, `+6281500${Math.floor(Math.random() * 900000 + 100000)}`);
    const b = await newGuest(invitation.id, namaB, `+6281500${Math.floor(Math.random() * 900000 + 100000)}`);
    await enqueueJobs(db, invitation.id, "undangan", [{ guestId: a.id, phone: a.phone, message: "A", senderUserId: ownerId }]);
    await enqueueJobs(db, invitation.id, "undangan", [{ guestId: b.id, phone: b.phone, message: "B", senderUserId: pengirimB }]);
    return { invitation, ownerId, pengirimB };
  }

  it("hanya mengambil pesan milik pengirimnya dan menghitung kuota per nomor", async () => {
    await drain();
    const { invitation, ownerId, pengirimB } = await dua("Tamu Owner", "Tamu B");
    expect(await hasWaitingJobs(db, ownerId)).toBe(true);
    const milikB = await claimNextJob(db, [], pengirimB);
    expect(milikB).toMatchObject({ message: "B", senderUserId: pengirimB });
    expect(await claimNextJob(db, [], pengirimB)).toBeNull();
    await finishJob(db, milikB!, { ok: true });
    expect(await senderSentLastDay(db, pengirimB)).toBe(1);
    expect(await senderSentLastDay(db, ownerId)).toBe(0);
    expect(await invitationSummary(db, invitation.id, new Date(), pengirimB)).toMatchObject({ terkirim: 1, menunggu: 0 });
    expect(await invitationSummary(db, invitation.id, new Date(), ownerId)).toMatchObject({ terkirim: 0, menunggu: 1 });
    expect(await senderSummary(db, ownerId)).toMatchObject({ menunggu: 1 });
    await drain();
  });

  it("membatalkan antrean hanya milik satu pengirim", async () => {
    await drain();
    const { invitation, ownerId, pengirimB } = await dua("Tamu Owner 2", "Tamu B2");
    expect(await cancelPending(db, invitation.id, ownerId)).toBe(1);
    const sisa = await db.select().from(waJob).where(eq(waJob.invitationId, invitation.id));
    expect(sisa.find((job) => job.senderUserId === pengirimB)?.status).toBe("menunggu");
    expect(sisa.find((job) => job.senderUserId === ownerId)?.status).toBe("dibatalkan");
    await drain();
  });
});
