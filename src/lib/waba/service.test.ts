import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { guest as guestTable, user as userTable } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { saveWabaConfig } from "./config-service";
import * as wabaClient from "./client";
import type { AdminUser } from "@/lib/session";
import {
  getUserWabaStatus,
  listWabaMessages,
  sendBatchInvitationViaWaba,
  sendGuestInvitationViaWaba,
  updateUserWabaQuota,
} from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("WABA Service", () => {
  const adminUser: AdminUser = {
    id: "admin-1",
    name: "Admin Utama",
    email: "admin@example.com",
    role: "superadmin",
    roleLabel: "Super Admin",
    permissions: ["pengaturan", "kelola-akun", "kelola-undangan"],
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    // Default config aktif
    await saveWabaConfig(db, {
      aktif: true,
      baseUrl: "https://waba.test.com",
      apiKey: "secret-waba-key",
      defaultTemplate: "undangan_resmi",
      language: "id",
    });
  });

  it("membaca status default WABA pengguna (allowed: false, quota: 0, sentCount: 0)", async () => {
    const { ownerId } = await seedInvitation(db);
    const status = await getUserWabaStatus(db, ownerId);
    expect(status.wabaAllowed).toBe(false);
    expect(status.wabaQuota).toBe(0);
    expect(status.wabaSentCount).toBe(0);
  });

  it("admin dapat mengatur izin WABA dan kuota kredit", async () => {
    const { ownerId } = await seedInvitation(db);

    // 1. Izinkan WABA
    const res1 = await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
    });
    expect(res1.ok).toBe(true);
    if (res1.ok) {
      expect(res1.allowed).toBe(true);
      expect(res1.quota).toBe(0);
    }

    // 2. Tambah kuota +50
    const res2 = await updateUserWabaQuota(db, adminUser, ownerId, {
      mode: "tambah",
      jumlah: 50,
    });
    expect(res2.ok).toBe(true);
    if (res2.ok) {
      expect(res2.quota).toBe(50);
    }

    // 3. Kurangi kuota -20
    const res3 = await updateUserWabaQuota(db, adminUser, ownerId, {
      mode: "kurang",
      jumlah: 20,
    });
    expect(res3.ok).toBe(true);
    if (res3.ok) {
      expect(res3.quota).toBe(30);
    }

    // 4. Atur kuota jadi 100
    const res4 = await updateUserWabaQuota(db, adminUser, ownerId, {
      mode: "atur",
      jumlah: 100,
    });
    expect(res4.ok).toBe(true);
    if (res4.ok) {
      expect(res4.quota).toBe(100);
    }

    const check = await getUserWabaStatus(db, ownerId);
    expect(check.wabaAllowed).toBe(true);
    expect(check.wabaQuota).toBe(100);
  });

  it("menolak pengiriman jika kuota habis atau izin WABA belum diberikan", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Tamu Test",
        phone: "081234567890",
        token: "token-test-1",
      })
      .returning();

    // Akun belum diizinkan
    const resNotAllowed = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });
    expect(resNotAllowed.ok).toBe(false);
    if (!resNotAllowed.ok) {
      expect(resNotAllowed.code).toBe("NOT_ALLOWED");
    }

    // Izinkan tapi kuota masih 0
    await updateUserWabaQuota(db, adminUser, ownerId, { wabaAllowed: true });
    const resNoCredit = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });
    expect(resNoCredit.ok).toBe(false);
    if (!resNoCredit.ok) {
      expect(resNoCredit.code).toBe("NO_CREDIT");
    }
  });

  it("mengurangi 1 kuota, menambah wabaSentCount, dan mencatat wabaMessage saat berhasil dikirim", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 5,
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Budi Santoso",
        phone: "081299998888",
        token: "token-budi-1",
      })
      .returning();

    // Mock response gateway sukses
    vi.spyOn(wabaClient, "sendWabaNotification").mockResolvedValue({
      ok: true,
      data: {
        id: "msg-gateway-123",
        to: tamu.phone!,
        status: "sent",
        template: "undangan_resmi",
      },
    });

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.remainingQuota).toBe(4);
    }

    // Cek user kuota & sent count di DB
    const [userAfter] = await db.select().from(userTable).where(eq(userTable.id, ownerId));
    expect(userAfter.wabaQuota).toBe(4);
    expect(userAfter.wabaSentCount).toBe(1);

    // Cek status tamu
    const [tamuAfter] = await db.select().from(guestTable).where(eq(guestTable.id, tamu.id));
    expect(tamuAfter.sentAt).not.toBeNull();

    // Cek pesan tercatat di wabaMessage
    const messages = await listWabaMessages(db, invitation.id);
    expect(messages.length).toBe(1);
    expect(messages[0].recipientName).toBe("Budi Santoso");
    expect(messages[0].status).toBe("sent");
    expect(messages[0].wabaQueueId).toBe("msg-gateway-123");
  });

  it("merefund kuota kredit jika gateway WABA gagal merespons", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 3,
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Andi Gagal",
        phone: "081211112222",
        token: "token-andi-1",
      })
      .returning();

    // Mock response gateway gagal
    vi.spyOn(wabaClient, "sendWabaNotification").mockResolvedValue({
      ok: false,
      error: "Gateway timeout / nomor tidak valid",
    });

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("GATEWAY_ERROR");
    }

    // Kuota harus tetap 3 (dikembalikan / di-refund)
    const [userAfter] = await db.select().from(userTable).where(eq(userTable.id, ownerId));
    expect(userAfter.wabaQuota).toBe(3);
    expect(userAfter.wabaSentCount).toBe(0);

    // Pesan tercatat sebagai failed
    const messages = await listWabaMessages(db, invitation.id);
    const failedMsg = messages.find((m) => m.guestId === tamu.id);
    expect(failedMsg).toBeDefined();
    expect(failedMsg?.status).toBe("failed");
  });

  it("sendBatchInvitationViaWaba mengirim tamu yang belum terkirim hingga batas kuota", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 2, // Kuota hanya 2
    });

    // Masukkan 3 tamu belum terkirim
    for (let i = 1; i <= 3; i++) {
      await db.insert(guestTable).values({
        invitationId: invitation.id,
        name: `Tamu Batch ${i}`,
        phone: `08120000000${i}`,
        token: `token-batch-${i}`,
      });
    }

    vi.spyOn(wabaClient, "sendWabaNotification").mockResolvedValue({
      ok: true,
      data: {
        id: "batch-msg",
        to: "081200000001",
        status: "sent",
        template: "undangan_resmi",
      },
    });

    const batchRes = await sendBatchInvitationViaWaba(db, {
      invitationId: invitation.id,
      senderUserId: ownerId,
    });

    expect(batchRes.ok).toBe(true);
    expect(batchRes.totalSent).toBe(2); // Hanya bisa kirim 2 sesuai kuota
    expect(batchRes.remainingQuota).toBe(0);

    const [userAfter] = await db.select().from(userTable).where(eq(userTable.id, ownerId));
    expect(userAfter.wabaQuota).toBe(0);
    expect(userAfter.wabaSentCount).toBe(2);
  });

  it("anggota tim yang memiliki izin WABA dapat mengirim dan memotong kuotanya sendiri meskipun pemilik tidak punya izin WABA", async () => {
    const { invitation } = await seedInvitation(db);
    // Pemilik tidak punya izin WABA

    const memberId = "team-member-waba";
    await db.insert(userTable).values({
      id: memberId,
      name: "Anggota Tim",
      email: "member@example.com",
    });

    // Beri izin WABA ke anggota tim
    await updateUserWabaQuota(db, adminUser, memberId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 10,
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Tamu Tim",
        phone: "081298765432",
        token: "token-tamu-tim",
      })
      .returning();

    vi.spyOn(wabaClient, "sendWabaNotification").mockResolvedValue({
      ok: true,
      data: {
        id: "msg-member-123",
        to: tamu.phone!,
        status: "sent",
        template: "undangan_resmi",
      },
    });

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: memberId,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.remainingQuota).toBe(9);
    }

    const [memberAfter] = await db.select().from(userTable).where(eq(userTable.id, memberId));
    expect(memberAfter.wabaQuota).toBe(9);
    expect(memberAfter.wabaSentCount).toBe(1);
  });
});
