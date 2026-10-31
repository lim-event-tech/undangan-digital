import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { templateRegistry } from "@/db/schema";
import { createTestDb, type TestDb } from "@/test/db";
import { TEMPLATES } from "./registry";
import { syncTemplates } from "./sync";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("syncTemplates", () => {
  it("mendaftarkan template baru dalam keadaan tersembunyi", async () => {
    expect(await syncTemplates(db)).toBe(TEMPLATES.length);
    const rows = await db.select().from(templateRegistry);
    expect(rows.map((r) => ({ key: r.key, visible: r.visible }))).toEqual(
      TEMPLATES.map((t) => ({ key: t.key, visible: false })),
    );
  });

  it("tidak menyembunyikan lagi template yang sudah ditampilkan saat dijalankan ulang", async () => {
    const key = TEMPLATES[0].key;
    await db.update(templateRegistry).set({ visible: true, label: "Lama" }).where(eq(templateRegistry.key, key));
    await syncTemplates(db);
    const [row] = await db.select().from(templateRegistry).where(eq(templateRegistry.key, key));
    expect(row.visible).toBe(true);
    expect(row.label).toBe(TEMPLATES[0].label);
  });

  it("menampilkan semua template dengan opsi show", async () => {
    await db.update(templateRegistry).set({ visible: false });
    await syncTemplates(db, { show: true });
    const rows = await db.select().from(templateRegistry);
    expect(rows.every((r) => r.visible)).toBe(true);
  });
});
