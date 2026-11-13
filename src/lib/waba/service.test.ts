import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { guest as guestTable, user as userTable } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { saveWabaConfig } from "./config-service";
import * as wabaClient from "./client";
import type { AdminUser } from "@/lib/session";
import { addPhoto } from "@/lib/photos/service";
import { saveContentText } from "@/lib/invitations/editor";
import {
  buildWabaBodyParameters,
  formatWabaSingleVariableContent,
  validateTemplateName,
} from "./templates-guide";
import {
  getUserWabaStatus,
  listWabaMessages,
  sendBatchInvitationViaWaba,
  sendGuestInvitationViaWaba,
  updateUserWabaQuota,
} from "./service";

let db: TestDb;

function jpeg(isi = 1): Buffer {
  const bytes = Buffer.alloc(64, isi);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

async function seedInvitationWithCover(
  targetDb: TestDb,
  options?: { title?: string },
) {
  const seeded = await seedInvitation(targetDb, options?.title ? { title: options.title } : undefined);
  const photoRes = await addPhoto(targetDb, seeded.invitation.id, {
    kind: "cover",
    fileName: "sampul.jpg",
    bytes: jpeg(1),
  });
  if (!photoRes.ok) throw new Error("Gagal seed foto cover");
  return seeded;
}

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
    const { invitation, ownerId } = await seedInvitationWithCover(db);
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
        template: "lim_undangan_resmi",
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
    const { invitation, ownerId } = await seedInvitationWithCover(db);
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
    const { invitation, ownerId } = await seedInvitationWithCover(db);
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
        template: "lim_undangan_resmi",
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
    const { invitation } = await seedInvitationWithCover(db);
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
        template: "lim_undangan_resmi",
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

  it("pengiriman WABA resmi standar LIM-RSVP: 1 header image, 1 variabel konten gabungan tanpa line break, tanpa tombol", async () => {
    const { invitation, ownerId } = await seedInvitationWithCover(db);
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 5,
    });

    // Simpan template pesan dengan banyak baris dan line breaks di konten undangan
    await saveContentText(db, invitation.id, {
      wabaTemplate: "lim_undangan_resmi",
      pesanWa: "Yth. {nama},\n\nKami mengundang ke {event}.\nBuka: {link}\n\nRSVP {batas_rsvp}.\nTerima kasih.",
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Ibu Ratna",
        phone: "081233445566",
        token: "token-ratna-std",
      })
      .returning();

    let capturedOptions: wabaClient.SendWabaOptions | null = null;

    vi.spyOn(wabaClient, "sendWabaNotification").mockImplementation(async (_cfg, opts) => {
      capturedOptions = opts;
      return {
        ok: true,
        data: {
          id: "msg-lim-standard",
          to: opts.to,
          status: "sent",
          template: opts.template,
        },
      };
    });

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });

    expect(res.ok).toBe(true);
    const sentOpts = capturedOptions as unknown as wabaClient.SendWabaOptions;
    expect(sentOpts).not.toBeNull();
    expect(sentOpts.template).toBe("lim_undangan_resmi");

    // 1. Verifikasi Header Image
    expect(sentOpts.parameters?.header).toBeDefined();
    expect(sentOpts.parameters?.header?.type).toBe("image");
    expect(sentOpts.parameters?.header?.mediaUrl).toMatch(/\/foto\//);

    // 2. Verifikasi 1 variabel konten gabungan
    const bodyParams = sentOpts.parameters?.body || [];
    expect(bodyParams.length).toBe(1);
    const contentVar = bodyParams[0];

    // 3. Verifikasi TIDAK ADA line break di dalam variabel
    expect(contentVar).not.toMatch(/[\r\n]/);
    expect(contentVar).toContain("Ibu Ratna");
    expect(contentVar).toContain("token-ratna");
    expect(contentVar).toContain("Terima kasih.");

    // 4. Verifikasi TANPA TOMBOL
    expect(sentOpts.parameters?.buttons).toBeUndefined();
  });

  it("mendukung template multi-variabel lama jika templateBodyText memiliki {{2}}", async () => {
    const { invitation, ownerId } = await seedInvitationWithCover(db);
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 5,
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Ibu Ratna",
        phone: "081233445566",
        token: "token-ratna-multi",
      })
      .returning();

    let sentBody: string[] = [];

    vi.spyOn(wabaClient, "sendWabaNotification").mockImplementation(async (_cfg, opts) => {
      sentBody = opts.parameters?.body || [];
      return {
        ok: true,
        data: {
          id: "msg-kustom",
          to: opts.to,
          status: "sent",
          template: opts.template,
        },
      };
    });

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
      templateOverride: "template_multi_var",
      templateBodyText: "Halo {{1}}, hadir di {{2}}, rsvp {{3}}, tautan {{4}}",
    });

    expect(res.ok).toBe(true);
    expect(sentBody.length).toBe(4);
    expect(sentBody[0]).toBe("Ibu Ratna");
    expect(sentBody[1]).toContain("Event");
    expect(sentBody[3]).toContain("token-ratna");
  });

  it("gagal mengirim dan tidak mengurangi kuota jika poster khusus aktif tetapi belum diunggah", async () => {
    const { invitation, ownerId } = await seedInvitationWithCover(db);
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 5,
    });

    // Aktifkan pilihan poster khusus di waPoster
    await saveContentText(db, invitation.id, {
      waPoster: { kirim: true, sumber: "khusus" },
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Tamu Khusus",
        phone: "081299991111",
        token: "token-khusus",
      })
      .returning();

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("Poster khusus WhatsApp belum diunggah");
    }

    // Kuota tidak terpotong
    const [userAfter] = await db.select().from(userTable).where(eq(userTable.id, ownerId));
    expect(userAfter.wabaQuota).toBe(5);
  });

  it("gagal mengirim jika foto cover atau poster belum diunggah sama sekali untuk header gambar", async () => {
    const { invitation, ownerId } = await seedInvitation(db); // Tanpa cover foto
    await updateUserWabaQuota(db, adminUser, ownerId, {
      wabaAllowed: true,
      mode: "atur",
      jumlah: 5,
    });

    const [tamu] = await db
      .insert(guestTable)
      .values({
        invitationId: invitation.id,
        name: "Tamu Tanpa Foto",
        phone: "081299992222",
        token: "token-tanpa-foto",
      })
      .returning();

    const res = await sendGuestInvitationViaWaba(db, {
      invitationId: invitation.id,
      guestId: tamu.id,
      senderUserId: ownerId,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("Foto sampul atau poster undangan belum diunggah");
    }
  });

  it("formatWabaSingleVariableContent membersihkan seluruh line break dan menormalkan spasi", () => {
    const raw = `Yth. Bapak Ahmad,
    
Kami mengundang Anda pada:
The Wedding of Sarah & Dimas

Tautan:
https://lim.id/ahmad-123

Terima kasih.`;

    const cleaned = formatWabaSingleVariableContent(raw);
    expect(cleaned).not.toMatch(/[\r\n]/);
    expect(cleaned).toBe(
      "Yth. Bapak Ahmad, Kami mengundang Anda pada: The Wedding of Sarah & Dimas Tautan: https://lim.id/ahmad-123 Terima kasih.",
    );
  });

  it("buildWabaBodyParameters memetakan variabel sesuai jumlah placeholder di template Meta", () => {
    const ctx = {
      guestName: "Budi",
      eventTitle: "Nikah",
      deadlinePhrase: "sebelum besok",
      link: "https://lim.id/budi",
      token: "budi",
    };

    // 2 variabel: {{1}} dan {{2}}
    const p2 = buildWabaBodyParameters("Halo {{1}}, hadir di {{2}} ya", ctx);
    expect(p2).toEqual(["Budi", "Nikah"]);

    // 4 variabel
    const p4 = buildWabaBodyParameters("Halo {{1}}, hadir {{2}}, rsvp {{3}}, link {{4}}", ctx);
    expect(p4).toEqual(["Budi", "Nikah", "sebelum besok", "https://lim.id/budi"]);
  });

  it("validateTemplateName memvalidasi format nama template Meta", () => {
    expect(validateTemplateName("lim_undangan_resmi").ok).toBe(true);
    expect(validateTemplateName("undangan123").ok).toBe(true);
    // Tidak boleh huruf besar, spasi, atau simbol lain
    expect(validateTemplateName("Undangan Resmi").ok).toBe(false);
    expect(validateTemplateName("undangan-resmi").ok).toBe(false);
    expect(validateTemplateName("").ok).toBe(false);
  });
});
