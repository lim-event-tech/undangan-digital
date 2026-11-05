import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guest, waJob } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
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
