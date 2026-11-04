import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { account, auditLog, guest as guestTable, invitation, session, user } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { markSent } from "@/lib/guests/sending";
import { submitRsvp } from "@/lib/rsvp/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { buildAuditCsv, listAudit, listAuditActors, recordAudit, SYSTEM_ACTOR } from "./audit";
import {
  adminChangeSlug,
  adminDeleteInvitation,
  adminSetDeadline,
  getAccountStats,
  getInvitationAdmin,
  getPlatformStats,
  listAccounts,
  listInvitationsAdmin,
  setAccountStatus,
  setInvitationStatusAdmin,
} from "./queries";
import { can, normalizePermissions, PERMISSIONS } from "./roles";
import {
  changeAdminRole,
  createAdmin,
  listAdmins,
  removeAdmin,
  resetAdminPassword,
} from "./team";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function addGuest(invitationId: string, name: string, phone: string) {
  const events = await listEventDetails(db, invitationId);
  return createGuest(db, invitationId, {
    name,
    phone,
    groupName: null,
    eventIds: events.map((e) => e.id),
    maxAdults: 2,
    maxChildren: 0,
  });
}

async function answer(invitationSlug: string, token: string, now?: Date) {
  return submitRsvp(db, {
    slug: invitationSlug,
    token,
    read: () => ({ attending: "ya", adults: "2", children: "0", note: "" }),
    now,
  });
}

describe("peran dan izin", () => {
  it("memeriksa izin dari daftar izin milik admin", () => {
    const dukungan = { permissions: ["lihat", "ubah-undangan"] };
    expect(can(dukungan, "lihat")).toBe(true);
    expect(can(dukungan, "ubah-undangan")).toBe(true);
    expect(can(dukungan, "tangguhkan")).toBe(false);
    expect(can(null, "lihat")).toBe(false);
    expect(PERMISSIONS.length).toBeGreaterThan(5);
  });

  it("menormalkan izin: selalu memuat lihat, membuang izin asing dan izin tim", () => {
    expect(normalizePermissions(["hapus", "hapus", "tim", "asing", 3])).toEqual(["lihat", "hapus"]);
    expect(normalizePermissions([])).toEqual(["lihat"]);
  });
});

describe("log audit", () => {
  it("mencatat dan menyaring menurut pelaku, jenis, dan rentang waktu", async () => {
    const now = new Date("2026-11-20T03:00:00.000Z");
    await recordAudit(db, {
      actor: { id: "u1", name: "Admin utama" },
      category: "pengaturan",
      action: "Mengubah pengaturan",
      target: "Pendaftaran",
      now: new Date("2026-11-19T03:00:00.000Z"),
    });
    await recordAudit(db, {
      actor: SYSTEM_ACTOR,
      category: "sistem",
      action: "Menangguhkan otomatis",
      now: new Date("2026-11-01T03:00:00.000Z"),
    });

    const recent = await listAudit(db, { sinceDays: 7, now });
    expect(recent.map((e) => e.action)).toEqual(["Mengubah pengaturan"]);
    const system = await listAudit(db, { actorName: "Sistem" });
    expect(system.map((e) => e.category)).toEqual(["sistem"]);
    expect((await listAudit(db, { category: "pengaturan" })).length).toBe(1);
    expect(await listAuditActors(db)).toEqual(["Admin utama", "Sistem"]);
  });

  it("tidak bisa diubah, dihapus, atau dikosongkan, bahkan lewat SQL langsung", async () => {
    await recordAudit(db, { actor: SYSTEM_ACTOR, category: "sistem", action: "Uji" });
    await expect(db.update(auditLog).set({ action: "Diubah" })).rejects.toThrow();
    await expect(db.delete(auditLog)).rejects.toThrow();
    expect((await listAudit(db)).length).toBeGreaterThan(0);
  });

  it("mengekspor CSV dengan perlindungan rumus", async () => {
    const csv = buildAuditCsv([
      {
        id: "1",
        actorId: null,
        actorName: "=cmd",
        category: "akun",
        action: "Memblokir akun",
        target: "a@b.id",
        detail: "",
        createdAt: new Date("2026-11-10T03:00:00.000Z"),
      },
    ]);
    expect(csv.startsWith("﻿Waktu;Pelaku;Jenis;Tindakan;Target;Rincian")).toBe(true);
    expect(csv).toContain("'=cmd");
  });
});

describe("tim admin", () => {
  it("membuat admin dengan kata sandi ter-hash dan peran yang dipilih", async () => {
    const created = await createAdmin(db, {
      name: "  Nia   Kusuma ",
      email: "Nia.K@Example.com",
      password: "kata-sandi-panjang",
      role: "dukungan",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const [row] = await db.select().from(user).where(eq(user.id, created.id));
    expect(row).toMatchObject({
      name: "Nia Kusuma",
      email: "nia.k@example.com",
      adminRole: "dukungan",
      emailVerified: true,
      status: "aktif",
    });
    const [credential] = await db.select().from(account).where(eq(account.userId, created.id));
    expect(credential.providerId).toBe("credential");
    expect(credential.password).toBeTruthy();
    expect(credential.password).not.toContain("kata-sandi-panjang");
  });

  it("menolak email kembar, email rusak, nama kosong, dan kata sandi pendek", async () => {
    const base = { name: "Bima", email: "bima@example.com", password: "kata-sandi-panjang", role: "lihat" };
    expect((await createAdmin(db, base)).ok).toBe(true);
    expect(await createAdmin(db, base)).toEqual({ ok: false, error: "email-dipakai" });
    expect(await createAdmin(db, { ...base, email: "bukan-email" })).toEqual({
      ok: false,
      error: "email-tidak-valid",
    });
    expect(await createAdmin(db, { ...base, email: "x@example.com", name: "  " })).toEqual({
      ok: false,
      error: "nama-kosong",
    });
    const weak = await createAdmin(db, { ...base, email: "y@example.com", password: "pendek" });
    expect(weak).toMatchObject({ ok: false, error: "sandi" });
    expect(await createAdmin(db, { ...base, email: "z@example.com", role: "tidak-ada" })).toEqual({
      ok: false,
      error: "peran",
    });
  });

  it("mendaftarkan admin hanya dengan email Google tanpa akun kata sandi", async () => {
    const created = await createAdmin(db, { name: "Dewi", email: "Dewi@Gmail.com", role: "dukungan" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const [row] = await db.select().from(user).where(eq(user.id, created.id));
    expect(row).toMatchObject({ email: "dewi@gmail.com", adminRole: "dukungan", emailVerified: true });
    expect(await db.select().from(account).where(eq(account.userId, created.id))).toHaveLength(0);
    const members = await listAdmins(db);
    expect(members.find((m) => m.email === "dewi@gmail.com")).toMatchObject({
      roleLabel: "Dukungan",
      methods: [],
    });

    expect(await resetAdminPassword(db, created.id, "kata-sandi-awal-panjang")).toEqual({ ok: true, created: true });
    expect(await db.select().from(account).where(eq(account.userId, created.id))).toHaveLength(1);
  });

  it("menolak email yang sudah dipakai akun pengguna", async () => {
    const seeded = await seedInvitation(db);
    const [owner] = await db.select().from(user).where(eq(user.id, seeded.ownerId));
    expect(await createAdmin(db, { name: "Pasangan", email: owner.email, role: "lihat" })).toEqual({
      ok: false,
      error: "email-pengguna",
    });
  });

  it("mengubah peran dan mencabut akses tetapi menjaga super admin terakhir", async () => {
    const solo = await createDb();
    const only = await createAdmin(solo, {
      name: "Satu-satunya",
      email: "super@example.com",
      password: "kata-sandi-panjang",
      role: "super",
    });
    if (!only.ok) throw new Error("gagal");
    expect(await changeAdminRole(solo, only.id, "dukungan")).toEqual({ ok: false, error: "super-terakhir" });
    expect(await removeAdmin(solo, only.id)).toEqual({ ok: false, error: "super-terakhir" });

    const second = await createAdmin(solo, {
      name: "Kedua",
      email: "super2@example.com",
      password: "kata-sandi-panjang",
      role: "super",
    });
    if (!second.ok) throw new Error("gagal");
    expect(await changeAdminRole(solo, only.id, "dukungan")).toEqual({ ok: true });
    expect((await listAdmins(solo)).map((a) => [a.email, a.role])).toEqual([
      ["super@example.com", "dukungan"],
      ["super2@example.com", "super"],
    ]);
    expect(await removeAdmin(solo, only.id)).toEqual({ ok: true });
    expect(await removeAdmin(solo, only.id)).toEqual({ ok: false, error: "tidak-ada" });
  });

  it("mengganti kata sandi dan mengeluarkan semua sesi", async () => {
    const created = await createAdmin(db, {
      name: "Rani",
      email: "rani@example.com",
      password: "kata-sandi-panjang",
      role: "lihat",
    });
    if (!created.ok) throw new Error("gagal");
    const [before] = await db.select().from(account).where(eq(account.userId, created.id));
    await db.insert(session).values({
      id: "sesi-rani",
      token: "token-rani",
      userId: created.id,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    expect(await resetAdminPassword(db, created.id, "pendek")).toMatchObject({ ok: false, error: "sandi" });
    expect(await resetAdminPassword(db, created.id, "kata-sandi-baru-panjang")).toEqual({ ok: true, created: false });
    const [after] = await db.select().from(account).where(eq(account.userId, created.id));
    expect(after.password).not.toBe(before.password);
    expect(await db.select().from(session).where(eq(session.userId, created.id))).toHaveLength(0);
  });
});

async function createDb() {
  return createTestDb();
}

describe("daftar undangan admin", () => {
  it("memuat hitungan tamu, terkirim, dibuka, dan menjawab serta bisa dicari dan disaring", async () => {
    const a = await seedInvitation(db, { title: "Andi" });
    const b = await seedInvitation(db, { title: "Bagas" });
    const g1 = await addGuest(a.invitation.id, "Tamu A1", "+6281500000001");
    const g2 = await addGuest(a.invitation.id, "Tamu A2", "+6281500000002");
    await addGuest(a.invitation.id, "Tamu A3", "+6281500000003");
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, a.invitation.id));
    await markSent(db, a.invitation.id, g1.id);
    await markSent(db, a.invitation.id, g2.id);
    await answer(a.invitation.slug, g1.token);

    const all = await listInvitationsAdmin(db, { sort: "terbaru" });
    const rowA = all.rows.find((r) => r.id === a.invitation.id)!;
    expect(rowA).toMatchObject({ guests: 3, sent: 2, opened: 0, responded: 1, status: "terbit" });
    expect(rowA.ownerEmail).toContain("@example.com");
    expect(all.total).toBeGreaterThanOrEqual(2);

    expect((await listInvitationsAdmin(db, { q: "bagas" })).rows.map((r) => r.id)).toEqual([b.invitation.id]);
    expect((await listInvitationsAdmin(db, { status: "terbit", q: "andi" })).rows).toHaveLength(1);
    expect((await listInvitationsAdmin(db, { status: "ditangguhkan", q: "andi" })).rows).toHaveLength(0);
    expect((await listInvitationsAdmin(db, { q: "100%" })).rows).toHaveLength(0);
  });

  it("mengurutkan menurut jumlah tamu dan memotong halaman", async () => {
    const fresh = await createDb();
    const small = await seedInvitation(fresh, { title: "Kecil" });
    const big = await seedInvitation(fresh, { title: "Besar" });
    for (const [index, owner] of [small, big].entries()) {
      const count = index === 0 ? 1 : 3;
      const events = await listEventDetails(fresh, owner.invitation.id);
      for (let i = 0; i < count; i += 1) {
        await createGuest(fresh, owner.invitation.id, {
          name: `Tamu ${index}-${i}`,
          phone: `+62816000${index}00${i}0`,
          groupName: null,
          eventIds: [events[0].id],
          maxAdults: 2,
          maxChildren: 0,
        });
      }
    }
    const byGuests = await listInvitationsAdmin(fresh, { sort: "tamu" });
    expect(byGuests.rows.map((r) => r.title)).toEqual(["Besar", "Kecil"]);
    const paged = await listInvitationsAdmin(fresh, { sort: "tamu", pageSize: 1, page: 2 });
    expect(paged).toMatchObject({ total: 2, page: 2 });
    expect(paged.rows.map((r) => r.title)).toEqual(["Kecil"]);
    expect((await listInvitationsAdmin(fresh, { sort: "terdekat" })).rows).toHaveLength(2);
    expect((await listInvitationsAdmin(fresh, { sort: "respons" })).rows).toHaveLength(2);
  });

  it("memuat detail undangan, pemilik, metode masuk, dan kekurangan isian", async () => {
    const seeded = await seedInvitation(db, { title: "Detail" });
    await db.insert(account).values({
      id: `akun-${seeded.ownerId}`,
      accountId: seeded.ownerId,
      providerId: "google",
      userId: seeded.ownerId,
    });
    const detail = await getInvitationAdmin(db, seeded.invitation.id);
    expect(detail).toMatchObject({
      slug: seeded.invitation.slug,
      events: 2,
      guests: 0,
      slugLocked: false,
      ownerStatus: "aktif",
      ownerMethods: ["Google"],
    });
    expect(detail!.missing).toContain("Foto cover");
    expect(await getInvitationAdmin(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});

describe("tindakan admin atas undangan", () => {
  it("menangguhkan dan mengaktifkan kembali sesuai kelengkapan isian", async () => {
    const seeded = await seedInvitation(db);
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
    expect(await setInvitationStatusAdmin(db, seeded.invitation.id, "tangguhkan")).toBe("ditangguhkan");
    expect(await setInvitationStatusAdmin(db, seeded.invitation.id, "aktifkan")).toBe("draf");
    expect(await setInvitationStatusAdmin(db, seeded.invitation.id, "aktifkan")).toBe("draf");
    expect(await setInvitationStatusAdmin(db, "00000000-0000-4000-8000-000000000000", "tangguhkan")).toBeNull();
  });

  it("mengubah slug walau terkunci, mengubah batas RSVP, dan menghapus permanen", async () => {
    const seeded = await seedInvitation(db);
    const guest = await addGuest(seeded.invitation.id, "Tamu", "+6281700000001");
    await markSent(db, seeded.invitation.id, guest.id);
    expect(await adminChangeSlug(db, seeded.invitation.id, "slug-baru-admin")).toEqual({
      ok: true,
      slug: "slug-baru-admin",
    });

    const deadline = new Date("2026-12-31T16:59:59.000Z");
    expect(await adminSetDeadline(db, seeded.invitation.id, deadline)).toBe(true);
    const [row] = await db.select().from(invitation).where(eq(invitation.id, seeded.invitation.id));
    expect(row.rsvpDeadline?.toISOString()).toBe(deadline.toISOString());

    expect(await adminDeleteInvitation(db, seeded.invitation.id)).toBe(true);
    expect(await adminDeleteInvitation(db, seeded.invitation.id)).toBe(false);
  });

});

describe("akun pengguna", () => {
  it("mendaftar akun tanpa admin, dengan metode masuk dan undangannya", async () => {
    const fresh = await createDb();
    const google = await seedInvitation(fresh, { title: "Gugel" });
    const email = await seedInvitation(fresh, { title: "Imel" });
    await fresh.insert(account).values([
      { id: "a-google", accountId: google.ownerId, providerId: "google", userId: google.ownerId },
      { id: "a-email", accountId: email.ownerId, providerId: "credential", userId: email.ownerId, password: "x" },
    ]);
    await createAdmin(fresh, {
      name: "Admin",
      email: "admin@example.com",
      password: "kata-sandi-panjang",
      role: "super",
    });

    const stats = await getAccountStats(fresh);
    expect(stats).toMatchObject({ total: 2, google: 1, email: 1, blocked: 0 });

    const list = await listAccounts(fresh, {});
    expect(list.total).toBe(2);
    expect(list.rows.find((r) => r.id === google.ownerId)).toMatchObject({
      methods: ["Google"],
      invitationName: "Gugel",
      invitationStatus: "draf",
    });
    expect((await listAccounts(fresh, { method: "email" })).rows.map((r) => r.id)).toEqual([email.ownerId]);
    expect((await listAccounts(fresh, { q: "pemilik" })).total).toBe(2);
    expect((await listAccounts(fresh, { q: "admin@" })).total).toBe(0);
  });

  it("memblokir akun menangguhkan undangannya dan mengeluarkan sesi, membuka blokir tidak mengaktifkan undangan", async () => {
    const seeded = await seedInvitation(db);
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
    await db.insert(session).values({
      id: `sesi-${seeded.ownerId}`,
      token: `token-${seeded.ownerId}`,
      userId: seeded.ownerId,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    expect(await setAccountStatus(db, seeded.ownerId, "diblokir")).toEqual({ ok: true, suspended: 1 });
    const [u] = await db.select().from(user).where(eq(user.id, seeded.ownerId));
    const [i] = await db.select().from(invitation).where(eq(invitation.id, seeded.invitation.id));
    expect([u.status, i.status]).toEqual(["diblokir", "ditangguhkan"]);
    expect(await db.select().from(session).where(eq(session.userId, seeded.ownerId))).toHaveLength(0);

    expect(await setAccountStatus(db, seeded.ownerId, "aktif")).toEqual({ ok: true, suspended: 0 });
    const [again] = await db.select().from(invitation).where(eq(invitation.id, seeded.invitation.id));
    expect(again.status).toBe("ditangguhkan");
  });

  it("tidak bisa memblokir akun admin lewat jalur akun pengguna", async () => {
    const admin = await createAdmin(db, {
      name: "Admin Lain",
      email: "lain@example.com",
      password: "kata-sandi-panjang",
      role: "super",
    });
    if (!admin.ok) throw new Error("gagal");
    expect(await setAccountStatus(db, admin.id, "diblokir")).toEqual({ ok: false, suspended: 0 });
  });
});

describe("statistik platform", () => {
  it("menghitung akun, corong, aktivitas harian, dan pemakaian template", async () => {
    const fresh = await createDb();
    const now = new Date("2026-11-15T05:00:00.000Z");
    const a = await seedInvitation(fresh, { title: "Satu" });
    const b = await seedInvitation(fresh, { title: "Dua" });
    await seedInvitation(fresh, { title: "Tiga" });
    await fresh
      .update(invitation)
      .set({ status: "terbit", updatedAt: new Date("2026-11-01T00:00:00.000Z") })
      .where(eq(invitation.id, b.invitation.id));
    await fresh.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, a.invitation.id));

    const events = await listEventDetails(fresh, a.invitation.id);
    const guest = await createGuest(fresh, a.invitation.id, {
      name: "Tamu",
      phone: "+6281800000001",
      groupName: null,
      eventIds: [events[0].id],
      maxAdults: 2,
      maxChildren: 0,
    });
    await markSent(fresh, a.invitation.id, guest.id);
    await fresh
      .update(guestTable)
      .set({ firstOpenedAt: new Date("2026-11-14T10:00:00.000Z") })
      .where(eq(guestTable.id, guest.id));
    await submitRsvp(fresh, {
      slug: a.invitation.slug,
      token: guest.token,
      read: () => ({ attending: "ya", adults: "1", children: "0", note: "" }),
      now: new Date("2026-11-15T01:00:00.000Z"),
    });

    const stats = await getPlatformStats(fresh, 7, now);
    expect(stats.accounts).toBe(3);
    expect(stats.invitations).toBe(3);
    expect(stats.published).toBe(2);
    expect(stats.funnel.map((f) => [f.key, f.count])).toEqual([
      ["daftar", 3],
      ["buat", 3],
      ["terbit", 2],
      ["kirim", 1],
      ["rsvp", 1],
    ]);
    expect(stats.daily).toHaveLength(7);
    expect(stats.daily[6]).toMatchObject({ date: "2026-11-15", rsvp: 1 });
    expect(stats.daily.find((d) => d.date === "2026-11-14")?.opened).toBe(1);
    expect(stats.templates).toEqual([{ key: "melati", count: 3 }]);
  });
});
