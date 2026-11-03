import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { getSettings, saveSettings } from "./service";
import {
  DEFAULT_SETTINGS,
  activeAnnouncement,
  normalizeReservedSlug,
  readSettings,
} from "./settings";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("readSettings", () => {
  it("memakai nilai bawaan saat kosong atau rusak", () => {
    expect(readSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(
      readSettings({
        daftarTerbuka: "ya",
        pengumuman: { teks: 5, jenis: "aneh", sampai: "kemarin" },
        pemeliharaan: [],
        slugCadangan: "bukan daftar",
        pesanWaBawaan: 7,
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("menyaring kata cadangan, menghapus duplikat, dan memotong teks panjang", () => {
    const settings = readSettings({
      slugCadangan: ["Bantuan", "bantuan", "bad slug", "", "ok_1", 5],
      pengumuman: { teks: "x".repeat(400), jenis: "pemeliharaan", sampai: "2026-12-01" },
    });
    expect(settings.slugCadangan).toEqual(["bantuan", "ok_1"]);
    expect(settings.pengumuman.teks).toHaveLength(300);
    expect(settings.pengumuman).toMatchObject({ jenis: "pemeliharaan", sampai: "2026-12-01" });
  });
});

describe("normalizeReservedSlug", () => {
  it("menerima huruf kecil, angka, garis bawah, dan tanda hubung di tengah", () => {
    expect(normalizeReservedSlug("  Template ")).toBe("template");
    expect(normalizeReservedSlug("_next")).toBe("_next");
    expect(normalizeReservedSlug("a b")).toBeNull();
    expect(normalizeReservedSlug("-a")).toBeNull();
    expect(normalizeReservedSlug("")).toBeNull();
  });
});

describe("activeAnnouncement", () => {
  const settings = readSettings({ pengumuman: { teks: "Halo", jenis: "info", sampai: "2026-11-20" } });

  it("tampil sampai tanggal yang ditentukan, lalu hilang", () => {
    expect(activeAnnouncement(settings, "2026-11-20")?.teks).toBe("Halo");
    expect(activeAnnouncement(settings, "2026-11-21")).toBeNull();
  });

  it("tidak tampil bila teks kosong", () => {
    expect(activeAnnouncement(DEFAULT_SETTINGS, "2026-11-01")).toBeNull();
  });
});

describe("simpan pengaturan", () => {
  it("menyimpan sebagian, menggabungkan dengan bawaan, dan menimpa nilai lama", async () => {
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);

    const first = await saveSettings(db, { daftarTerbuka: false, slugCadangan: ["bantuan"] });
    expect(first.daftarTerbuka).toBe(false);
    expect(first.slugCadangan).toEqual(["bantuan"]);
    expect(first.pemeliharaan).toEqual(DEFAULT_SETTINGS.pemeliharaan);

    const second = await saveSettings(db, {
      pemeliharaan: { aktif: true, pesan: "Sedang diperbarui" },
      daftarTerbuka: true,
    });
    expect(second).toMatchObject({
      daftarTerbuka: true,
      slugCadangan: ["bantuan"],
      pemeliharaan: { aktif: true, pesan: "Sedang diperbarui" },
    });
  });
});
