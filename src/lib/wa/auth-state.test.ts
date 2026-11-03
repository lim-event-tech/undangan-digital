import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import {
  clearStoredSession,
  deserialize,
  hasStoredSession,
  serialize,
  loadPostgresAuthState,
} from "./auth-state";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("serialize", () => {
  it("menjaga Buffer tetap Buffer setelah bolak-balik", () => {
    const value = { key: Buffer.from([1, 2, 3, 250]), nama: "x" };
    const back = deserialize<typeof value>(serialize(value));
    expect(Buffer.isBuffer(back.key)).toBe(true);
    expect([...back.key]).toEqual([1, 2, 3, 250]);
  });
});

describe("loadPostgresAuthState", () => {
  it("membuat kredensial baru dan belum dianggap punya sesi", async () => {
    const { state } = await loadPostgresAuthState(db);
    expect(state.creds.registered).toBe(false);
    expect(await hasStoredSession(db)).toBe(false);
  });

  it("menyimpan dan membaca kembali kredensial dan kunci", async () => {
    const first = await loadPostgresAuthState(db);
    (first.state.creds as { registered: boolean }).registered = true;
    await first.saveCreds();
    await first.state.keys.set({
      session: { "62811.0": Buffer.from([9, 8, 7]) },
      "pre-key": { "1": { public: Buffer.from([1]), private: Buffer.from([2]) } },
    });

    expect(await hasStoredSession(db)).toBe(true);
    const second = await loadPostgresAuthState(db);
    expect(second.state.creds.registered).toBe(true);
    expect([...second.state.creds.noiseKey.public]).toEqual([...first.state.creds.noiseKey.public]);

    const sessions = await second.state.keys.get("session", ["62811.0", "tidak-ada"]);
    expect([...sessions["62811.0"]]).toEqual([9, 8, 7]);
    expect(sessions["tidak-ada"]).toBeUndefined();
    const preKeys = await second.state.keys.get("pre-key", ["1"]);
    expect([...preKeys["1"].private]).toEqual([2]);
  });

  it("menghapus kunci yang diisi null", async () => {
    const auth = await loadPostgresAuthState(db);
    await auth.state.keys.set({ session: { hapus: Buffer.from([1]) } });
    await auth.state.keys.set({ session: { hapus: null } });
    const result = await auth.state.keys.get("session", ["hapus"]);
    expect(result.hapus).toBeUndefined();
  });

  it("membersihkan seluruh sesi", async () => {
    await clearStoredSession(db);
    expect(await hasStoredSession(db)).toBe(false);
    const { state } = await loadPostgresAuthState(db);
    expect(state.creds.registered).toBe(false);
  });
});
