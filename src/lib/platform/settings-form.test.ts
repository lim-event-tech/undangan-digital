import { describe, expect, it } from "vitest";
import { describeSettingChanges, parseSettingsForm } from "./settings-form";
import { DEFAULT_SETTINGS } from "./settings";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

const BASE = { pemeliharaanPesan: "Sedang diperbarui" };

describe("parseSettingsForm", () => {
  it("membaca saklar, pengumuman, kata cadangan, dan pesan WhatsApp", () => {
    const parsed = parseSettingsForm(
      form({
        ...BASE,
        daftarTerbuka: "on",
        pemeliharaanAktif: "on",
        pengumumanTeks: " Fitur ucapan sudah aktif ",
        pengumumanJenis: "fitur-baru",
        pengumumanSampai: "2026-12-01",
        slugCadangan: "Bantuan, template\nbantuan; _next",
        pesanWaBawaan: "Yth. {nama}, buka {link}",
      }),
    );
    expect(parsed).toEqual({
      ok: true,
      input: {
        daftarTerbuka: true,
        pengumuman: { teks: "Fitur ucapan sudah aktif", jenis: "fitur-baru", sampai: "2026-12-01" },
        pemeliharaan: { aktif: true, pesan: "Sedang diperbarui" },
        slugCadangan: ["bantuan", "template", "_next"],
        pesanWaBawaan: "Yth. {nama}, buka {link}",
      },
    });
  });

  it("memakai nilai aman bila saklar tidak dicentang dan jenis tidak dikenal", () => {
    const parsed = parseSettingsForm(form({ ...BASE, pengumumanJenis: "aneh" }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.input.daftarTerbuka).toBe(false);
      expect(parsed.input.pemeliharaan.aktif).toBe(false);
      expect(parsed.input.pengumuman).toEqual({ teks: "", jenis: "info", sampai: null });
    }
  });

  it("menolak tanggal rusak, kata cadangan tidak valid, pesan WA tanpa tautan, dan pesan pemeliharaan kosong", () => {
    const parsed = parseSettingsForm(
      form({
        pemeliharaanPesan: "  ",
        pengumumanSampai: "kemarin",
        slugCadangan: "ok, bad slug!",
        pesanWaBawaan: "Halo tanpa tautan",
      }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual([
        "pemeliharaanPesan",
        "pengumumanSampai",
        "pesanWaBawaan",
        "slugCadangan",
      ]);
    }
  });
});

describe("describeSettingChanges", () => {
  it("menyebut hanya perubahan yang terjadi", () => {
    expect(describeSettingChanges(DEFAULT_SETTINGS, DEFAULT_SETTINGS)).toEqual([]);
    const changes = describeSettingChanges(DEFAULT_SETTINGS, {
      ...DEFAULT_SETTINGS,
      daftarTerbuka: false,
      pemeliharaan: { ...DEFAULT_SETTINGS.pemeliharaan, aktif: true },
      slugCadangan: ["bantuan"],
    });
    expect(changes).toEqual([
      "Pendaftaran baru aktif menjadi nonaktif",
      "Mode pemeliharaan nonaktif menjadi aktif",
      "Slug dicadangkan 0 menjadi 1 kata",
    ]);
  });
});
