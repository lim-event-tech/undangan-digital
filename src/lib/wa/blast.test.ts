import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { queueBlast, pickTargets, type TargetGuest } from "./blast";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

const now = new Date("2026-11-03T10:00:00.000Z");

function tamu(id: string, patch: Partial<TargetGuest> = {}): TargetGuest {
  return {
    id,
    name: `Tamu ${id}`,
    phone: "+6281700000000",
    token: "token",
    sentAt: null,
    remindedAt: null,
    answered: false,
    ...patch,
  };
}

describe("pickTargets undangan", () => {
  it("hanya tamu yang belum dikirimi dan belum antre", () => {
    const guests = [
      tamu("a"),
      tamu("b", { sentAt: new Date("2026-11-01T00:00:00.000Z") }),
      tamu("c"),
    ];
    const result = pickTargets("undangan", guests, new Set(["c"]), now);
    expect(result.map((g) => g.id)).toEqual(["a"]);
  });
});

describe("pickTargets pengingat", () => {
  const sent = new Date("2026-11-01T00:00:00.000Z");

  it("hanya tamu yang sudah dikirimi undangan dan belum menjawab", () => {
    const guests = [
      tamu("a", { sentAt: sent }),
      tamu("b"),
      tamu("c", { sentAt: sent, answered: true }),
    ];
    expect(pickTargets("pengingat", guests, new Set(), now).map((g) => g.id)).toEqual(["a"]);
  });

  it("melewati tamu yang baru diingatkan dalam 24 jam terakhir", () => {
    const guests = [
      tamu("a", { sentAt: sent, remindedAt: new Date("2026-11-03T02:00:00.000Z") }),
      tamu("b", { sentAt: sent, remindedAt: new Date("2026-11-02T09:00:00.000Z") }),
    ];
    expect(pickTargets("pengingat", guests, new Set(), now).map((g) => g.id)).toEqual(["b"]);
  });
});

describe("queueBlast", () => {
  it("menolak saat undangan belum terbit", async () => {
    const { invitation } = await seedInvitation(db);
    const result = await queueBlast(db, { ...invitation, status: "draf" }, "undangan", now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("belum terbit");
  });

  it("menolak saat tidak ada tamu yang perlu dikirimi", async () => {
    const { invitation } = await seedInvitation(db);
    const result = await queueBlast(db, { ...invitation, status: "terbit" }, "undangan", now);
    expect(result).toEqual({ ok: false, error: "Tidak ada tamu yang perlu dikirimi." });
  });
});
