import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation, templateRegistry } from "@/db/schema";
import { syncTemplates } from "@/templates/sync";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import {
  canUseTemplate,
  listSelectableTemplates,
  listTemplateCatalog,
  listVisibleTemplates,
  moveTemplate,
  updateTemplate,
} from "./templates";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
  await syncTemplates(db);
});

describe("katalog template", () => {
  it("memuat template terdaftar berurutan dengan jumlah pemakaian", async () => {
    const seeded = await seedInvitation(db);
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
    await seedInvitation(db);

    const catalog = await listTemplateCatalog(db);
    expect(catalog.map((item) => item.key)).toEqual(["melati", "keraton", "bintang", "pasundan"]);
    expect(catalog[0]).toMatchObject({ used: 2, published: 1, visible: false, ribbon: null });
    expect(catalog[1]).toMatchObject({ used: 0, published: 0 });
  });

  it("menampilkan, menyembunyikan, memberi label, dan memberi pita", async () => {
    expect(await listVisibleTemplates(db)).toEqual([]);

    expect(await updateTemplate(db, "melati", { label: "  Melati   Klasik ", visible: true, ribbon: "Populer" })).toEqual({
      ok: true,
    });
    expect(await updateTemplate(db, "pasundan", { label: "Pasundan", visible: true, ribbon: "Baru" })).toEqual({
      ok: true,
    });
    expect(await listVisibleTemplates(db)).toEqual([
      { key: "melati", label: "Melati Klasik", ribbon: "Populer" },
      { key: "pasundan", label: "Tembaga", ribbon: "Baru" },
    ]);

    await updateTemplate(db, "pasundan", { label: "Pasundan", visible: false, ribbon: null });
    expect((await listVisibleTemplates(db)).map((item) => item.key)).toEqual(["melati"]);
  });

  it("menolak label kosong atau terlalu panjang dan template yang tidak ada", async () => {
    const base = { visible: true, ribbon: null };
    expect(await updateTemplate(db, "melati", { ...base, label: "   " })).toEqual({ ok: false, error: "label" });
    expect(await updateTemplate(db, "melati", { ...base, label: "x".repeat(41) })).toEqual({
      ok: false,
      error: "label",
    });
    expect(await updateTemplate(db, "tidak-ada", { ...base, label: "Baru" })).toEqual({
      ok: false,
      error: "tidak-ada",
    });
  });

  it("menggeser urutan satu langkah dan menolak geser keluar batas", async () => {
    expect(await moveTemplate(db, "melati", "naik")).toBe(false);
    expect(await moveTemplate(db, "melati", "turun")).toBe(true);
    expect((await listTemplateCatalog(db)).map((item) => item.key)).toEqual([
      "keraton",
      "melati",
      "bintang",
      "pasundan",
    ]);

    expect(await moveTemplate(db, "pasundan", "turun")).toBe(false);
    expect(await moveTemplate(db, "tidak-ada", "naik")).toBe(false);
    expect(await moveTemplate(db, "pasundan", "naik")).toBe(true);
    expect((await listTemplateCatalog(db)).map((item) => item.key)).toEqual([
      "keraton",
      "melati",
      "pasundan",
      "bintang",
    ]);
  });
});

describe("pilihan template untuk pasangan", () => {
  it("hanya menawarkan template yang tampil, ditambah template yang sedang dipakai", async () => {
    await db.update(templateRegistry).set({ visible: false, ribbon: null });
    expect(await listSelectableTemplates(db)).toEqual([{ key: "melati", label: "Paviliun", ribbon: null }]);

    await db.update(templateRegistry).set({ visible: true, ribbon: "Baru" }).where(eq(templateRegistry.key, "bintang"));
    expect(await listSelectableTemplates(db)).toEqual([{ key: "bintang", label: "Malam Berbintang", ribbon: "Baru" }]);

    const pilihan = await listSelectableTemplates(db, "pasundan");
    expect(pilihan.map((t) => t.key)).toEqual(["pasundan", "bintang"]);
    expect(pilihan[0].label).toBe("Tembaga");
  });

  it("menolak template tersembunyi atau tidak dikenal kecuali template yang sedang dipakai", async () => {
    await db.update(templateRegistry).set({ visible: false });
    await db.update(templateRegistry).set({ visible: true }).where(eq(templateRegistry.key, "keraton"));
    expect(await canUseTemplate(db, "keraton")).toBe(true);
    expect(await canUseTemplate(db, "pasundan")).toBe(false);
    expect(await canUseTemplate(db, "pasundan", "pasundan")).toBe(true);
    expect(await canUseTemplate(db, "tidak-ada", "tidak-ada")).toBe(false);
    expect(await canUseTemplate(db, 42)).toBe(false);
  });
});
