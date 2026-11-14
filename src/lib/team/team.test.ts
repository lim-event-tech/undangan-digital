import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { guest as guestTable, invitation as invitationTable, invitationInvite, invitationMember, user } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { commitImport, countGuests, createGuest, deleteGuest, findPhoneConflict, getGuest, listGroups, listGuests, updateGuest } from "@/lib/guests/service";
import { countSent, markSent } from "@/lib/guests/sending";
import { scanCheckin, checkinCounts, listCheckinGuests } from "@/lib/checkin/service";
import { checkinCode } from "@/lib/checkin/code";
import { saveContentText } from "@/lib/invitations/editor";
import { getDashboard } from "@/lib/rsvp/dashboard";
import { findGuestPage, submitRsvp } from "@/lib/rsvp/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { inviteMail } from "./mail";
import {
  INVITE_VALID_DAYS,
  MAX_MEMBERS,
  acceptInvite,
  createInvite,
  getInvitationAccess,
  getMemberContact,
  hashInviteToken,
  listInvitationsForMember,
  listMembers,
  listPendingInvites,
  looksLikeInviteToken,
  previewInvite,
  removeMember,
  revokeInvite,
  saveMemberContact,
  updateMember,
} from "./service";
import { checkinScope } from "./access";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function akun(id: string, extra: Partial<typeof user.$inferInsert> = {}) {
  await db.insert(user).values({ id, name: `Nama ${id}`, email: `${id}@example.com`, ...extra });
  return id;
}

async function setup() {
  const seeded = await seedInvitation(db);
  const salesA = await akun(`sales-a-${seeded.ownerId}`);
  const salesB = await akun(`sales-b-${seeded.ownerId}`);
  for (const id of [salesA, salesB]) {
    const invite = await createInvite(db, { invitationId: seeded.invitation.id, email: `${id}@example.com`, invitedBy: seeded.ownerId });
    if (!invite.ok) throw new Error("undangan gagal");
    expect(await acceptInvite(db, invite.token, { id })).toEqual({ ok: true, invitationId: seeded.invitation.id, role: "anggota" });
  }
  const events = await listEventDetails(db, seeded.invitation.id);
  return { ...seeded, salesA, salesB, eventIds: events.map((e) => e.id) };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

let urut = 0;
function tamu(ctx: Ctx, nama: string, addedBy: string, phone?: string) {
  urut += 1;
  return createGuest(db, ctx.invitation.id, { name: nama, phone: phone ?? `+62812000${String(urut).padStart(5, "0")}`, groupName: null, eventIds: [ctx.eventIds[0]], maxAttendees: 2 }, addedBy);
}

describe("undangan anggota tim", () => {
  it("membuat tautan acak yang hanya tersimpan sebagai hash dan berlaku tujuh hari", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const now = new Date("2026-11-10T00:00:00.000Z");
    const hasil = await createInvite(db, { invitationId: invitation.id, email: "  Budi@Example.com ", invitedBy: ownerId }, now);
    expect(hasil).toMatchObject({ ok: true, email: "budi@example.com" });
    if (!hasil.ok) return;
    expect(looksLikeInviteToken(hasil.token)).toBe(true);
    expect(hasil.expiresAt.toISOString()).toBe(new Date(now.getTime() + INVITE_VALID_DAYS * 86_400_000).toISOString());
    const [row] = await db.select().from(invitationInvite).where(eq(invitationInvite.invitationId, invitation.id));
    expect(row.tokenHash).toBe(hashInviteToken(hasil.token));
    expect(JSON.stringify(row)).not.toContain(hasil.token);
    expect(await listPendingInvites(db, invitation.id, now)).toHaveLength(1);
    expect(await listPendingInvites(db, invitation.id, new Date(now.getTime() + 8 * 86_400_000))).toHaveLength(0);
  });

  it("menolak email rusak, email pemilik, anggota yang sudah ada, dan melebihi batas", async () => {
    const ctx = await setup();
    const [pemilik] = await db.select({ email: user.email }).from(user).where(eq(user.id, ctx.ownerId));
    expect(await createInvite(db, { invitationId: ctx.invitation.id, email: "bukan-email", invitedBy: ctx.ownerId })).toEqual({ ok: false, error: "email-tidak-valid" });
    expect(await createInvite(db, { invitationId: ctx.invitation.id, email: pemilik.email.toUpperCase(), invitedBy: ctx.ownerId })).toEqual({ ok: false, error: "pemilik" });
    expect(await createInvite(db, { invitationId: ctx.invitation.id, email: `${ctx.salesA}@example.com`, invitedBy: ctx.ownerId })).toEqual({ ok: false, error: "sudah-anggota" });
    for (let i = 0; i < MAX_MEMBERS - 2; i++) expect((await createInvite(db, { invitationId: ctx.invitation.id, email: `tunggu${i}@example.com`, invitedBy: ctx.ownerId })).ok).toBe(true);
    expect(await createInvite(db, { invitationId: ctx.invitation.id, email: "kelebihan@example.com", invitedBy: ctx.ownerId })).toEqual({ ok: false, error: "penuh" });
    expect((await createInvite(db, { invitationId: ctx.invitation.id, email: "tunggu0@example.com", invitedBy: ctx.ownerId })).ok).toBe(true);
  });

  it("mengirim ulang membatalkan tautan lama dan tautan hanya bisa dipakai sekali", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const baru = await akun(`baru-${ownerId}`);
    const pertama = await createInvite(db, { invitationId: invitation.id, email: `baru-${ownerId}@example.com`, invitedBy: ownerId });
    const kedua = await createInvite(db, { invitationId: invitation.id, email: `baru-${ownerId}@example.com`, invitedBy: ownerId });
    if (!pertama.ok || !kedua.ok) throw new Error("gagal");
    expect((await previewInvite(db, pertama.token)).state).toBe("dicabut");
    expect((await previewInvite(db, kedua.token)).state).toBe("valid");
    expect(await acceptInvite(db, pertama.token, { id: baru })).toEqual({ ok: false, error: "dicabut" });
    expect(await acceptInvite(db, kedua.token, { id: baru })).toEqual({ ok: true, invitationId: invitation.id, role: "anggota" });
    expect(await acceptInvite(db, kedua.token, { id: baru })).toEqual({ ok: false, error: "dipakai" });
    expect(await listPendingInvites(db, invitation.id)).toHaveLength(0);
  });

  it("menolak penerimaan jika email akun tidak sesuai dengan email undangan tanpa menghabiskan tautan", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const hasil = await createInvite(db, { invitationId: invitation.id, email: "khusus@example.com", invitedBy: ownerId });
    if (!hasil.ok) throw new Error("gagal");
    const salah = await akun(`salah-${ownerId}`);
    expect(await acceptInvite(db, hasil.token, { id: salah, email: "lain@example.com" })).toEqual({ ok: false, error: "email-tidak-sesuai" });
    expect((await previewInvite(db, hasil.token)).state).toBe("valid");
    expect(await acceptInvite(db, hasil.token, { id: salah, email: "Khusus@Example.com" })).toEqual({ ok: true, invitationId: invitation.id, role: "anggota" });
  });

  it("menolak token yang kedaluwarsa, tidak ada, akun admin, pemilik sendiri, dan tidak menghabiskan tautan saat sudah anggota", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const now = new Date("2026-11-10T00:00:00.000Z");
    const hasil = await createInvite(db, { invitationId: invitation.id, email: "uji@example.com", invitedBy: ownerId }, now);
    if (!hasil.ok) throw new Error("gagal");
    const telat = new Date(now.getTime() + 8 * 86_400_000);
    expect((await previewInvite(db, hasil.token, telat)).state).toBe("kedaluwarsa");
    expect(await acceptInvite(db, hasil.token, { id: "x" }, telat)).toEqual({ ok: false, error: "kedaluwarsa" });
    expect(await acceptInvite(db, "A".repeat(32), { id: "x" })).toEqual({ ok: false, error: "tidak-ada" });
    expect(await acceptInvite(db, "pendek", { id: "x" })).toEqual({ ok: false, error: "tidak-ada" });
    expect(await acceptInvite(db, hasil.token, { id: "x", adminRole: "super" }, now)).toEqual({ ok: false, error: "akun-admin" });
    expect(await acceptInvite(db, hasil.token, { id: ownerId }, now)).toEqual({ ok: false, error: "pemilik" });
    const anggota = await akun(`anggota-${ownerId}`);
    await db.insert(invitationMember).values({ invitationId: invitation.id, userId: anggota });
    expect(await acceptInvite(db, hasil.token, { id: anggota }, now)).toEqual({ ok: false, error: "sudah-anggota" });
    expect((await previewInvite(db, hasil.token, now)).state).toBe("valid");
    expect(await revokeInvite(db, invitation.id, hasil.token.slice(0, 8))).toBe(false);
  });

  it("membangun surel undangan yang aman dari karakter HTML", () => {
    const surat = inviteMail({ to: "a@b.co", title: 'Rapat "Kerja" <b>', ownerName: "Ani & Budi", link: "https://x.test/terima/abc", expiresAt: new Date("2026-11-17T00:00:00.000Z") });
    expect(surat.subject).toContain("Rapat");
    expect(surat.html).not.toContain("<b>");
    expect(surat.html).toContain("Ani &amp; Budi");
    expect(surat.text).toContain("https://x.test/terima/abc");
  });

  it("menyesuaikan isi surel dengan peran dan menyertakan tautan serta batas berlaku", () => {
    const dasar = { to: "a@b.co", title: "Forum", ownerName: "Ani", link: "https://x.test/terima/abc", expiresAt: new Date("2026-11-17T00:00:00.000Z") };
    const anggota = inviteMail(dasar);
    const pemilik = inviteMail({ ...dasar, role: "pemilik" });
    expect(anggota.html).toContain("anggota tim");
    expect(anggota.html).toContain('href="https://x.test/terima/abc"');
    expect(anggota.html).toContain("17 November 2026");
    expect(anggota.text).toContain("17 November 2026");
    expect(pemilik.html).toContain("pemilik tim");
    expect(pemilik.text).toContain("Mengundang dan mengatur anggota tim lainnya");
    expect(anggota.subject).toBe('Ani mengundang Anda ke tim "Forum"');
  });

  it("tidak membiarkan tanda kutip tunggal merusak atribut HTML", () => {
    const surat = inviteMail({ to: "a@b.co", title: "x", ownerName: "O'Brien", link: "https://x.test/terima/a'b", expiresAt: new Date("2026-11-17T00:00:00.000Z") });
    expect(surat.html).toContain("O&#39;Brien");
    expect(surat.html).not.toContain("a'b");
  });
});

describe("akses menurut peran", () => {
  it("pemilik mendapat cakupan penuh, anggota hanya cakupan dirinya, orang lain tidak punya akses", async () => {
    const ctx = await setup();
    expect(await getInvitationAccess(db, ctx.ownerId, ctx.invitation.id)).toMatchObject({ role: "pemilik", scope: null });
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toMatchObject({ role: "anggota", scope: ctx.salesA });
    const orangLain = await akun(`luar-${ctx.ownerId}`);
    expect(await getInvitationAccess(db, orangLain, ctx.invitation.id)).toBeNull();
    expect(await getInvitationAccess(db, ctx.salesA, "bukan-uuid")).toBeNull();
    expect((await listInvitationsForMember(db, ctx.salesA)).map((row) => row.id)).toEqual([ctx.invitation.id]);
    expect(await listInvitationsForMember(db, ctx.ownerId)).toEqual([]);
    expect((await listMembers(db, ctx.invitation.id)).map((m) => m.userId).sort()).toEqual([ctx.salesA, ctx.salesB].sort());
  });

  it("menjaga data antar anggota: daftar, hitungan, ubah, hapus, bentrok nomor, impor, dan grup", async () => {
    const ctx = await setup();
    const a1 = await tamu(ctx, "Klien A1", ctx.salesA, "+6281200000901");
    const a2 = await tamu(ctx, "Klien A2", ctx.salesA);
    const b1 = await tamu(ctx, "Klien B1", ctx.salesB, "+6281200000902");
    const p1 = await tamu(ctx, "Tamu Pemilik", ctx.ownerId);

    const nama = async (addedBy?: string) => (await listGuests(db, ctx.invitation.id, { addedBy })).map((g) => g.name).sort();
    expect(await nama(ctx.salesA)).toEqual(["Klien A1", "Klien A2"]);
    expect(await nama(ctx.salesB)).toEqual(["Klien B1"]);
    expect(await nama()).toEqual(["Klien A1", "Klien A2", "Klien B1", "Tamu Pemilik"]);
    expect(await countGuests(db, ctx.invitation.id, ctx.salesA)).toBe(2);
    expect(await countGuests(db, ctx.invitation.id)).toBe(4);
    expect(await getGuest(db, ctx.invitation.id, b1.id, ctx.salesA)).toBeNull();
    expect((await getGuest(db, ctx.invitation.id, b1.id))?.addedBy).toBe(ctx.salesB);

    const masukan = { name: "Dicoba", phone: "+6281200000999", groupName: null, eventIds: [ctx.eventIds[0]], maxAttendees: 1 };
    expect(await updateGuest(db, ctx.invitation.id, b1.id, masukan, ctx.salesA)).toBeNull();
    expect((await getGuest(db, ctx.invitation.id, b1.id))?.name).toBe("Klien B1");
    expect(await deleteGuest(db, ctx.invitation.id, b1.id, ctx.salesA)).toBe(false);
    expect(await deleteGuest(db, ctx.invitation.id, p1.id, ctx.salesA)).toBe(false);
    expect((await updateGuest(db, ctx.invitation.id, a2.id, { ...masukan, name: "A2 baru" }, ctx.salesA))?.name).toBe("A2 baru");

    expect(await findPhoneConflict(db, ctx.invitation.id, "+6281200000902", undefined, ctx.salesA)).toBeNull();
    expect(await findPhoneConflict(db, ctx.invitation.id, "+6281200000902")).toMatchObject({ name: "Klien B1" });
    expect(await findPhoneConflict(db, ctx.invitation.id, "+6281200000901", undefined, ctx.salesA)).toMatchObject({ name: "Klien A1" });

    await db.update(guestTable).set({ groupId: null }).where(eq(guestTable.id, a1.id));
    const impor = await commitImport(db, ctx.invitation.id, [{ row: 2, nama: "Impor Sales B", whatsapp: "0812-0000-0902", grup: "VIP Sales B", acara: "", maks_peserta: "" }], false, ctx.salesB, ctx.salesB);
    expect(impor).toMatchObject({ ok: false });
    const imporBaru = await commitImport(db, ctx.invitation.id, [{ row: 2, nama: "Impor Sales B", whatsapp: "0812-0000-7777", grup: "VIP Sales B", acara: "", maks_peserta: "" }], false, ctx.salesB, ctx.salesB);
    expect(imporBaru).toMatchObject({ ok: true, imported: 1 });
    expect(await nama(ctx.salesB)).toEqual(["Impor Sales B", "Klien B1"]);
    expect((await listGroups(db, ctx.invitation.id, ctx.salesB)).map((g) => g.name)).toEqual(["VIP Sales B"]);
    expect(await listGroups(db, ctx.invitation.id, ctx.salesA)).toEqual([]);

    await markSent(db, ctx.invitation.id, a1.id);
    expect(await countSent(db, ctx.invitation.id, ctx.salesA)).toEqual({ total: 2, sent: 1 });
    expect(await countSent(db, ctx.invitation.id, ctx.salesB)).toEqual({ total: 2, sent: 0 });
  });

  it("memisahkan dashboard, check-in, dan pindai QR per anggota", async () => {
    const ctx = await setup();
    const a1 = await tamu(ctx, "Klien A1", ctx.salesA);
    const b1 = await tamu(ctx, "Klien B1", ctx.salesB);
    await db.update(invitationTable).set({ status: "terbit" }).where(eq(invitationTable.id, ctx.invitation.id));
    for (const g of [a1, b1]) await submitRsvp(db, { token: g.token, read: () => ({ attending: "ya", attendeeCount: "1", note: "" }) });

    expect((await getDashboard(db, ctx.invitation.id, {}, ctx.salesA)).guests.map((g) => g.name)).toEqual(["Klien A1"]);
    expect((await getDashboard(db, ctx.invitation.id)).guests).toHaveLength(2);
    expect((await listCheckinGuests(db, ctx.invitation.id, { addedBy: ctx.salesB })).map((g) => g.name)).toEqual(["Klien B1"]);
    expect((await checkinCounts(db, ctx.invitation.id, ctx.salesA)).confirmed).toBe(1);
    expect((await checkinCounts(db, ctx.invitation.id)).confirmed).toBe(2);

    expect((await scanCheckin(db, ctx.invitation, checkinCode(b1.token), new Date(), ctx.salesA)).result).toBe("tidak-dikenal");
    expect((await scanCheckin(db, ctx.invitation, checkinCode(a1.token), new Date(), ctx.salesA)).result).toBe("masuk");
    expect((await scanCheckin(db, ctx.invitation, checkinCode(b1.token))).result).toBe("masuk");
  });

  it("mengeluarkan anggota mengalihkan tamunya ke pemilik dan mencabut akses", async () => {
    const ctx = await setup();
    const a1 = await tamu(ctx, "Klien A1", ctx.salesA);
    const b1 = await tamu(ctx, "Klien B1", ctx.salesB);
    expect(await removeMember(db, ctx.invitation.id, ctx.salesA)).toBe(true);
    expect(await removeMember(db, ctx.invitation.id, ctx.salesA)).toBe(false);
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toBeNull();
    expect((await getGuest(db, ctx.invitation.id, a1.id))?.addedBy).toBe(ctx.ownerId);
    expect((await getGuest(db, ctx.invitation.id, b1.id))?.addedBy).toBe(ctx.salesB);
    expect(await listGuests(db, ctx.invitation.id, { addedBy: ctx.salesA })).toEqual([]);
    const sisa = await db.select().from(invitationMember).where(and(eq(invitationMember.invitationId, ctx.invitation.id), eq(invitationMember.userId, ctx.salesB)));
    expect(sisa).toHaveLength(1);
  });

  it("mengatur dan meng-override narahubung undangan khusus untuk tamu milik anggota tim", async () => {
    const ctx = await setup();
    await saveContentText(db, ctx.invitation.id, { kontak: { nama: "Panitia", telepon: "+628999999999", email: "panitia@utama.com" } });
    const a1 = await tamu(ctx, "Klien Sales A", ctx.salesA);
    const ownerGuest = await tamu(ctx, "Klien Pemilik", ctx.ownerId);

    // Sebelum diatur, narahubung memakai bawaan acara
    const pageAwal = await findGuestPage(db, a1.token);
    expect(pageAwal?.invitation.content.kontak.nama).toBe("Panitia");

    // Sales A mengatur kontak khusus
    expect(await saveMemberContact(db, ctx.invitation.id, ctx.salesA, {
      name: "Sales A Support",
      phone: "+628111222333",
      email: "sales-a@support.com",
    })).toBe(true);

    const contact = await getMemberContact(db, ctx.invitation.id, ctx.salesA);
    expect(contact).toEqual({
      name: "Sales A Support",
      phone: "+628111222333",
      email: "sales-a@support.com",
    });

    // Tamu milik Sales A melihat narahubung Sales A
    const pageSales = await findGuestPage(db, a1.token);
    expect(pageSales?.invitation.content.kontak).toEqual({
      nama: "Sales A Support",
      telepon: "+628111222333",
      email: "sales-a@support.com",
    });

    // Tamu pemilik tetap melihat kontak utama bawaan acara
    const pageOwner = await findGuestPage(db, ownerGuest.token);
    expect(pageOwner?.invitation.content.kontak.nama).toBe("Panitia");
  });
});

describe("pemilik tambahan dan hak check-in anggota", () => {
  it("undangan membawa peran dan hak check-in yang berlaku saat diterima", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const bersama = await akun(`bersama-${ownerId}`);
    const hasil = await createInvite(db, { invitationId: invitation.id, email: `bersama-${ownerId}@example.com`, invitedBy: ownerId, role: "pemilik" });
    if (!hasil.ok) throw new Error("gagal");
    expect((await previewInvite(db, hasil.token)).invite).toMatchObject({ role: "pemilik" });
    expect(await acceptInvite(db, hasil.token, { id: bersama })).toEqual({ ok: true, invitationId: invitation.id, role: "pemilik" });
    expect(await getInvitationAccess(db, bersama, invitation.id)).toMatchObject({ role: "pemilik", scope: null, creator: false, checkinAccess: "semua" });
    expect(await getInvitationAccess(db, ownerId, invitation.id)).toMatchObject({ role: "pemilik", scope: null, creator: true });
    expect((await listInvitationsForMember(db, bersama)).map((row) => ({ id: row.id, peran: row.peran }))).toEqual([{ id: invitation.id, peran: "pemilik" }]);
  });

  it("anggota biasa bawaannya hanya check-in tamu miliknya dan pemilik bisa mengubah peran serta hak", async () => {
    const ctx = await setup();
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toMatchObject({ role: "anggota", scope: ctx.salesA, creator: false, checkinAccess: "milik" });
    expect(await updateMember(db, ctx.invitation.id, ctx.salesA, { checkinAccess: "semua" })).toBe(true);
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toMatchObject({ role: "anggota", checkinAccess: "semua" });
    expect(await updateMember(db, ctx.invitation.id, ctx.salesA, { checkinAccess: "tidak" })).toBe(true);
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toMatchObject({ checkinAccess: "tidak" });
    expect(await updateMember(db, ctx.invitation.id, ctx.salesA, { role: "pemilik" })).toBe(true);
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toMatchObject({ role: "pemilik", scope: null, checkinAccess: "semua" });
    expect(await updateMember(db, ctx.invitation.id, ctx.salesA, { role: "anggota" })).toBe(true);
    expect(await getInvitationAccess(db, ctx.salesA, ctx.invitation.id)).toMatchObject({ role: "anggota", scope: ctx.salesA, checkinAccess: "tidak" });
    expect(await updateMember(db, ctx.invitation.id, ctx.ownerId, { role: "anggota" })).toBe(false);
    expect(await updateMember(db, ctx.invitation.id, "tidak-ada", { role: "pemilik" })).toBe(false);
    expect(await updateMember(db, ctx.invitation.id, ctx.salesA, {})).toBe(false);
  });

  it("cakupan check-in mengikuti hak: milik dibatasi ke anggota, semua tanpa batas", async () => {
    const ctx = await setup();
    expect(checkinScope("milik", ctx.salesA)).toBe(ctx.salesA);
    expect(checkinScope("semua", ctx.salesA)).toBeUndefined();
    expect(checkinScope("semua", null)).toBeUndefined();
    const punyaA = await tamu(ctx, "Tamu Sales A", ctx.salesA);
    const punyaB = await tamu(ctx, "Tamu Sales B", ctx.salesB);
    const [tokenA] = await db.select({ token: guestTable.token }).from(guestTable).where(eq(guestTable.id, punyaA.id));
    const [tokenB] = await db.select({ token: guestTable.token }).from(guestTable).where(eq(guestTable.id, punyaB.id));
    expect(await scanCheckin(db, ctx.invitation, checkinCode(tokenB.token), new Date(), checkinScope("milik", ctx.salesA))).toEqual({ result: "tidak-dikenal" });
    expect((await scanCheckin(db, ctx.invitation, checkinCode(tokenA.token), new Date(), checkinScope("milik", ctx.salesA))).result).toBe("belum-konfirmasi");
    expect((await scanCheckin(db, ctx.invitation, checkinCode(tokenB.token), new Date(), checkinScope("semua", ctx.salesA))).result).toBe("belum-konfirmasi");
  });

  it("pemilik tambahan yang keluar mengalihkan tamunya ke pembuat", async () => {
    const { invitation, ownerId } = await seedInvitation(db);
    const bersama = await akun(`keluar-${ownerId}`);
    const hasil = await createInvite(db, { invitationId: invitation.id, email: `keluar-${ownerId}@example.com`, invitedBy: ownerId, role: "pemilik" });
    if (!hasil.ok) throw new Error("gagal");
    await acceptInvite(db, hasil.token, { id: bersama });
    const events = await listEventDetails(db, invitation.id);
    const dibuat = await createGuest(db, invitation.id, { name: "Tamu Pemilik Bersama", phone: "+628120009999", groupName: null, eventIds: [events[0].id], maxAttendees: 1 }, bersama);
    expect(await removeMember(db, invitation.id, bersama)).toBe(true);
    const [baris] = await db.select({ addedBy: guestTable.addedBy }).from(guestTable).where(eq(guestTable.id, dibuat.id));
    expect(baris.addedBy).toBe(ownerId);
    expect(await getInvitationAccess(db, bersama, invitation.id)).toBeNull();
  });

  it("dashboard memuat nama anggota yang mengundang, dan pembuat bila tamu ditambahkan pembuat", async () => {
    const ctx = await setup();
    await tamu(ctx, "Tamu dari Sales", ctx.salesA);
    await tamu(ctx, "Tamu dari Pembuat", ctx.ownerId);
    const data = await getDashboard(db, ctx.invitation.id, {});
    const oleh = Object.fromEntries(data.guests.map((g) => [g.name, g.addedByName]));
    expect(oleh["Tamu dari Sales"]).toBe(`Nama ${ctx.salesA}`);
    expect(oleh["Tamu dari Pembuat"]).toMatch(/^Pemilik /);
  });
});
