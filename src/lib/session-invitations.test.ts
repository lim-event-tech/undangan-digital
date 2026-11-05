import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { adminRole, guest as guestTable, invitation as invitationTable, templateRegistry, user, waJob } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createInvitation, type Invitation } from "@/lib/invitations/service";

const mocks = vi.hoisted(() => ({ db: undefined as unknown as TestDb, session: vi.fn(), cookies: vi.fn() }));
vi.mock("@/db", () => ({ get db() { return mocks.db; } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("not-found"); },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/wa/manager", () => ({ getWaManager: () => ({ ready: () => true }) }));

import { ACTING_COOKIE, getWorkContextForInvitation, loadOwnedInvitation, requireInvitationById, requireOwnAccount } from "./session";
import * as editorActions from "@/app/undangan/[id]/isi/actions";
import * as guestActions from "@/app/undangan/[id]/tamu/actions";
import * as importActions from "@/app/undangan/[id]/tamu/impor/actions";
import * as sendingActions from "@/app/undangan/[id]/kirim/actions";
import * as checkinActions from "@/app/undangan/[id]/checkin/actions";
import * as wishActions from "@/app/undangan/[id]/ucapan/actions";
import * as templateActions from "@/app/undangan/[id]/template/actions";
import { createInvitationAction } from "@/app/undangan/baru/actions";
import { POST as uploadPhoto } from "@/app/api/foto/route";
import { POST as uploadMusic } from "@/app/api/musik/route";
import { GET as exportRsvp } from "@/app/undangan/[id]/ringkasan/ekspor/route";
import { createGuest } from "@/lib/guests/service";
import { listEventDetails } from "@/lib/events/service";
import { listPhotos } from "@/lib/photos/service";
import { getMusic } from "@/lib/music/service";
import { getOwnedInvitation, listInvitationsForOwner } from "@/lib/invitations/service";
import { saveWaConfig } from "@/lib/wa/config-service";

let ownerId: string;
let otherOwnerId: string;
let first: Invitation;
let second: Invitation;
let other: Invitation;
let actingId: string | null;

beforeAll(async () => {
  mocks.db = await createTestDb();
  const seeded = await seedInvitation(mocks.db);
  ownerId = seeded.ownerId;
  first = seeded.invitation;
  second = await createInvitation(mocks.db, ownerId, { title: "Workshop Kedua" });
  const another = await seedInvitation(mocks.db);
  otherOwnerId = another.ownerId;
  other = another.invitation;
  await mocks.db.insert(adminRole).values({ key: "uji-konteks", label: "Uji konteks", permissions: ["lihat", "kelola-undangan"] });
  await mocks.db.insert(user).values({ id: "admin-konteks", name: "Admin", email: "admin-konteks@example.com", adminRole: "uji-konteks" });
});

afterAll(async () => { await mocks.db.$client.close(); });

function session(id = ownerId, adminRole: string | null = null, status = "aktif") {
  return { user: { id, name: `Nama ${id}`, email: `${id}@example.com`, adminRole, status }, session: { id: `sesi-${id}` } };
}

beforeEach(async () => {
  vi.resetAllMocks();
  actingId = null;
  mocks.session.mockResolvedValue(session());
  mocks.cookies.mockImplementation(async () => ({ get: (name: string) => name === ACTING_COOKIE && actingId ? { value: actingId } : undefined }));
  await mocks.db.update(adminRole).set({ permissions: ["lihat", "kelola-undangan"] }).where(eq(adminRole.key, "uji-konteks"));
});

describe("konteks eksplisit milik pengguna", () => {
  it("berpindah A ke B dan kembali ke A tanpa memakai pilihan global", async () => {
    for (const target of [first, second, first]) {
      expect((await loadOwnedInvitation(ownerId, target.id))?.id).toBe(target.id);
      expect((await requireInvitationById(target.id)).invitation.id).toBe(target.id);
      expect(await getWorkContextForInvitation(target.id)).toMatchObject({ userId: ownerId, invitation: { id: target.id } });
    }
  });

  it("menolak ID milik akun lain dan ownerId yang dipalsukan", async () => {
    expect(await loadOwnedInvitation(ownerId, other.id)).toBeNull();
    expect(await loadOwnedInvitation(otherOwnerId, other.id)).toBeNull();
    await expect(requireInvitationById(other.id)).rejects.toThrow("not-found");
    expect(await getWorkContextForInvitation(other.id)).toEqual({ userId: ownerId, invitation: null });
    mocks.session.mockResolvedValue(session(otherOwnerId));
    expect(await loadOwnedInvitation(ownerId, first.id)).toBeNull();
    await expect(requireInvitationById(first.id)).rejects.toThrow("not-found");
  });

  it.each([undefined, null, "", "terbaru", {}, "00000000-0000-4000-8000-000000000000"])("tidak memakai undangan terbaru saat ID %j ditolak", async (id) => {
    expect(await loadOwnedInvitation(ownerId, id)).toBeNull();
    await expect(requireInvitationById(id)).rejects.toThrow("not-found");
    expect(await getWorkContextForInvitation(id)).toEqual({ userId: ownerId, invitation: null });
  });

  it("mengabaikan cookie kelola yang dipalsukan pengguna biasa", async () => {
    actingId = other.id;
    expect((await requireInvitationById(first.id)).invitation.id).toBe(first.id);
    await expect(requireInvitationById(other.id)).rejects.toThrow("not-found");
  });

  it("mengambil akun sesi asli untuk pengaturan akun", async () => {
    const current = session();
    mocks.session.mockResolvedValue(current);
    await requireInvitationById(first.id);
    await requireInvitationById(second.id);
    expect(await requireOwnAccount()).toEqual(current);
  });
});

describe("sesi dan mode kelola pada konteks ID", () => {
  it.each([null, { user: { id: "tanpa-akses", status: "diblokir" } }])("menolak sesi yang tidak berhak", async (current) => {
    mocks.session.mockResolvedValue(current);
    expect(await loadOwnedInvitation(ownerId, first.id)).toBeNull();
    expect(await getWorkContextForInvitation(first.id)).toBeNull();
    await expect(requireInvitationById(first.id)).rejects.toThrow(current ? "redirect:/masuk?galat=diblokir" : "redirect:/masuk");
  });

  it("membatasi admin ke target kelola yang persis sama meskipun pemilik punya undangan lain", async () => {
    actingId = first.id;
    mocks.session.mockResolvedValue(session("admin-konteks", "uji-konteks"));
    expect((await requireInvitationById(first.id)).invitation.id).toBe(first.id);
    expect((await requireInvitationById(first.id.toUpperCase())).invitation.id).toBe(first.id);
    expect(await getWorkContextForInvitation(first.id)).toMatchObject({ userId: ownerId, invitation: { id: first.id } });
    for (const id of [second.id, other.id]) {
      expect(await loadOwnedInvitation(ownerId, id)).toBeNull();
      await expect(requireInvitationById(id)).rejects.toThrow("not-found");
      expect(await getWorkContextForInvitation(id)).toEqual({ userId: ownerId, invitation: null });
    }
    expect(await loadOwnedInvitation(otherOwnerId, first.id)).toBeNull();
    await expect(requireOwnAccount()).rejects.toThrow("redirect:/admin");
  });

  it("menolak admin tanpa target kelola yang valid", async () => {
    mocks.session.mockResolvedValue(session("admin-konteks", "uji-konteks"));
    for (const id of [null, "rusak", "00000000-0000-4000-8000-000000000000"]) {
      actingId = id;
      expect(await loadOwnedInvitation(ownerId, first.id)).toBeNull();
      expect(await getWorkContextForInvitation(first.id)).toBeNull();
      await expect(requireInvitationById(first.id)).rejects.toThrow("redirect:/admin");
    }
  });

  it("memeriksa izin kelola pada server dan menolak izin yang sudah dicabut", async () => {
    actingId = first.id;
    mocks.session.mockResolvedValue(session("admin-konteks", "uji-konteks"));
    await mocks.db.update(adminRole).set({ permissions: ["lihat"] }).where(eq(adminRole.key, "uji-konteks"));
    expect(await loadOwnedInvitation(ownerId, first.id)).toBeNull();
    expect(await getWorkContextForInvitation(first.id)).toBeNull();
    await expect(requireInvitationById(first.id)).rejects.toThrow("redirect:/admin");
  });
});

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const actions = [editorActions, guestActions, importActions, sendingActions, checkinActions, wishActions, templateActions]
  .flatMap((module) => Object.entries(module).filter(([, value]) => typeof value === "function"));

describe("batas akses seluruh action pengelolaan", () => {
  it.each(actions)("%s menolak ID asing dan ID hilang sebelum memproses payload", async (_name, action) => {
    for (const id of [other.id, undefined]) {
      await expect(Reflect.apply(action, undefined, [id, new FormData(), new FormData()])).rejects.toThrow("not-found");
    }
  });

  it("menyimpan dua judul berdasarkan ID eksplisit dan mengabaikan ID lain pada form", async () => {
    expect(await editorActions.simpanTitleAction(first.id, form({ title: "Judul A", invitationId: second.id }))).toEqual({ ok: true });
    expect(await editorActions.simpanTitleAction(second.id, form({ title: "Judul B" }))).toEqual({ ok: true });
    expect((await getOwnedInvitation(mocks.db, ownerId, first.id))?.title).toBe("Judul A");
    expect((await getOwnedInvitation(mocks.db, ownerId, second.id))?.title).toBe("Judul B");
  });

  it("membuat undangan tambahan untuk akun sesi lalu membuka editor ID yang baru", async () => {
    await mocks.db.insert(templateRegistry).values({ key: "melati", label: "Melati", visible: true }).onConflictDoUpdate({ target: templateRegistry.key, set: { visible: true } });
    const before = await listInvitationsForOwner(mocks.db, ownerId);
    await expect(createInvitationAction({}, form({ title: "Acara Tambahan", template: "melati", ownerId: otherOwnerId }))).rejects.toThrow(/redirect:\/undangan\/[a-f0-9-]+\/isi/);
    const after = await listInvitationsForOwner(mocks.db, ownerId);
    const added = after.filter((item) => !before.some((old) => old.id === item.id));
    expect(added).toHaveLength(1);
    expect(added[0].title).toBe("Acara Tambahan");
    expect(await getOwnedInvitation(mocks.db, otherOwnerId, added[0].id)).toBeNull();
    expect((await listEventDetails(mocks.db, added[0].id))).toHaveLength(1);
    expect(await createInvitationAction({}, form({ title: "Tolak", template: "tidak-ada" }))).toMatchObject({ error: expect.any(String) });
  });

  it("menolak admin membuat undangan tambahan atas nama pemilik yang sedang dikelola", async () => {
    actingId = first.id;
    mocks.session.mockResolvedValue(session("admin-konteks", "uji-konteks"));
    await expect(createInvitationAction({}, form({ title: "Tidak boleh" }))).rejects.toThrow("redirect:/admin");
  });

  it("mengakhiri konteks kelola setelah admin menghapus target tanpa menghapus undangan saudara", async () => {
    const target = await createInvitation(mocks.db, ownerId, { title: "Hapus Dalam Kelola" });
    actingId = target.id;
    mocks.session.mockResolvedValue(session("admin-konteks", "uji-konteks"));
    const clear = vi.fn();
    mocks.cookies.mockImplementation(async () => ({ get: (name: string) => name === ACTING_COOKIE ? { value: actingId } : undefined, delete: clear }));
    await expect(editorActions.hapusUndanganAction(target.id)).rejects.toThrow("redirect:/admin/undangan");
    expect(clear).toHaveBeenCalledWith(ACTING_COOKIE);
    expect(await getOwnedInvitation(mocks.db, ownerId, target.id)).toBeNull();
    expect((await getOwnedInvitation(mocks.db, ownerId, second.id))?.id).toBe(second.id);
  });

  it("mengimpor tamu dan mengekspor hanya undangan yang diminta", async () => {
    const a = await createInvitation(mocks.db, ownerId, { title: "Impor A" });
    const b = await createInvitation(mocks.db, ownerId, { title: "Impor B" });
    const row = { row: 2, nama: "Tamu Impor A", whatsapp: "081234567890", grup: "", acara: "", maks_dewasa: "1", maks_anak: "0" };
    expect(await importActions.commitImportAction(a.id, [row], false)).toMatchObject({ ok: true, imported: 1 });
    const [event] = await listEventDetails(mocks.db, b.id);
    await createGuest(mocks.db, b.id, { name: "Tamu Rahasia B", phone: "+6281234567890", eventIds: [event.id], groupName: null, maxAdults: 1, maxChildren: 0 });
    const response = await exportRsvp(new Request(`http://localhost/undangan/${a.id}/ringkasan/ekspor?format=csv`), { params: Promise.resolve({ id: a.id }) });
    const csv = await response.text();
    expect(csv).toContain("Tamu Impor A");
    expect(csv).not.toContain("Tamu Rahasia B");
    await expect(exportRsvp(new Request("http://localhost/ekspor"), { params: Promise.resolve({ id: other.id }) })).rejects.toThrow("not-found");
  });
});

describe("unggah, WhatsApp dan check-in dengan ID eksplisit", () => {
  it("memisahkan unggahan foto/musik dan menolak API tanpa ID atau ID akun lain", async () => {
    const a = await createInvitation(mocks.db, ownerId, { title: "Media A" });
    const b = await createInvitation(mocks.db, ownerId, { title: "Media B" });
    const bytes = Buffer.alloc(64, 7);
    bytes.set([0xff, 0xd8, 0xff]);
    const photo = form({ jenis: "cover", invitationId: b.id });
    photo.set("file", new File([bytes], "a.jpg", { type: "image/jpeg" }));
    expect((await uploadPhoto(new Request(`http://localhost/api/foto?invitationId=${a.id}`, { method: "POST", body: photo }))).status).toBe(200);
    expect((await listPhotos(mocks.db, a.id))).toHaveLength(1);
    expect((await listPhotos(mocks.db, b.id))).toHaveLength(0);
    const music = new FormData();
    music.set("file", new File(["ID3contoh"], "b.mp3", { type: "audio/mpeg" }));
    expect((await uploadMusic(new Request(`http://localhost/api/musik?invitationId=${b.id}`, { method: "POST", body: music }))).status).toBe(200);
    expect(await getMusic(mocks.db, a.id)).toBeNull();
    expect((await getMusic(mocks.db, b.id))?.fileName).toBe("b.mp3");
    for (const handler of [uploadPhoto, uploadMusic]) {
      for (const query of ["", `?invitationId=${other.id}`, "?invitationId=rusak"]) {
        expect((await handler(new Request(`http://localhost/api/unggah${query}`, { method: "POST" }))).status).toBe(404);
      }
    }
  });

  it("membatasi antrean WhatsApp dan check-in pada undangan yang benar", async () => {
    const a = await createInvitation(mocks.db, ownerId, { title: "Operasional A" });
    const b = await createInvitation(mocks.db, ownerId, { title: "Operasional B" });
    const guests = [];
    for (const target of [a, b]) {
      const [event] = await listEventDetails(mocks.db, target.id);
      guests.push(await createGuest(mocks.db, target.id, { name: `Tamu ${target.title}`, phone: "+6281234567890", eventIds: [event.id], groupName: null, maxAdults: 1, maxChildren: 0 }));
      await mocks.db.update(invitationTable).set({ status: "terbit" }).where(eq(invitationTable.id, target.id));
      await checkinActions.gantiKunciAction(target.id);
    }
    expect((await getOwnedInvitation(mocks.db, ownerId, a.id))?.checkinKey).not.toBe((await getOwnedInvitation(mocks.db, ownerId, b.id))?.checkinKey);
    await sendingActions.tandaiTerkirimAction(a.id, guests[1].id);
    await checkinActions.masukkanTamuAction(a.id, form({ id: guests[1].id }));
    const [before] = await mocks.db.select().from(guestTable).where(eq(guestTable.id, guests[1].id));
    expect(before.sentAt).toBeNull();
    expect(before.checkedInAt).toBeNull();
    await checkinActions.masukkanTamuAction(a.id, form({ id: guests[0].id }));
    const [checked] = await mocks.db.select().from(guestTable).where(eq(guestTable.id, guests[0].id));
    expect(checked.checkedInAt).not.toBeNull();
    await saveWaConfig(mocks.db, { aktif: true });
    for (const target of [a, b]) expect(await sendingActions.kirimOtomatisAction(target.id, null, form())).toMatchObject({ ok: true, added: 1 });
    await sendingActions.batalkanAntreanAction(a.id);
    expect((await mocks.db.select().from(waJob).where(eq(waJob.invitationId, a.id))).map((job) => job.status)).toEqual(["dibatalkan"]);
    expect((await mocks.db.select().from(waJob).where(eq(waJob.invitationId, b.id))).map((job) => job.status)).toEqual(["menunggu"]);
  });
});
