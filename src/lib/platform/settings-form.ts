import { isDateString } from "@/lib/datetime";
import type { FieldErrors } from "@/lib/save-result";
import { checkMessageTemplate } from "@/lib/whatsapp";
import {
  ANNOUNCEMENT_KINDS,
  SETTING_LIMITS,
  normalizeReservedSlug,
  type AnnouncementKind,
  type PlatformSettings,
} from "./settings";

function raw(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function paragraph(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function parseSettingsForm(
  formData: FormData,
): { ok: true; input: PlatformSettings } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const pengumumanTeks = paragraph(raw(formData, "pengumumanTeks"));
  if (pengumumanTeks.length > SETTING_LIMITS.pengumuman) {
    errors.pengumumanTeks = `Maksimal ${SETTING_LIMITS.pengumuman} karakter`;
  }
  const jenisText = raw(formData, "pengumumanJenis");
  const jenis = (ANNOUNCEMENT_KINDS as readonly string[]).includes(jenisText)
    ? (jenisText as AnnouncementKind)
    : "info";
  const sampaiText = raw(formData, "pengumumanSampai").trim();
  if (sampaiText && !isDateString(sampaiText)) errors.pengumumanSampai = "Tanggal tidak valid";

  const pesanPemeliharaan = paragraph(raw(formData, "pemeliharaanPesan"));
  if (!pesanPemeliharaan) errors.pemeliharaanPesan = "Pesan pemeliharaan wajib diisi";
  else if (pesanPemeliharaan.length > SETTING_LIMITS.pesanPemeliharaan) {
    errors.pemeliharaanPesan = `Maksimal ${SETTING_LIMITS.pesanPemeliharaan} karakter`;
  }

  const slugs: string[] = [];
  for (const item of raw(formData, "slugCadangan").split(/[\s,;]+/)) {
    if (!item) continue;
    const slug = normalizeReservedSlug(item);
    if (!slug) {
      errors.slugCadangan = `“${item.slice(0, 20)}” bukan kata yang valid. Pakai huruf kecil, angka, garis bawah, dan tanda hubung`;
      break;
    }
    if (!slugs.includes(slug)) slugs.push(slug);
  }
  if (slugs.length > SETTING_LIMITS.jumlahSlugCadangan) {
    errors.slugCadangan = `Maksimal ${SETTING_LIMITS.jumlahSlugCadangan} kata`;
  }

  const pesanWa = checkMessageTemplate(raw(formData, "pesanWaBawaan"));
  if (!pesanWa.ok) errors.pesanWaBawaan = pesanWa.error;

  if (Object.keys(errors).length > 0 || !pesanWa.ok) return { ok: false, errors };
  return {
    ok: true,
    input: {
      daftarTerbuka: formData.get("daftarTerbuka") !== null,
      pengumuman: { teks: pengumumanTeks, jenis, sampai: sampaiText || null },
      pemeliharaan: { aktif: formData.get("pemeliharaanAktif") !== null, pesan: pesanPemeliharaan },
      slugCadangan: slugs,
      pesanWaBawaan: pesanWa.template,
    },
  };
}

export function describeSettingChanges(before: PlatformSettings, after: PlatformSettings): string[] {
  const changes: string[] = [];
  const yesNo = (value: boolean) => (value ? "aktif" : "nonaktif");
  if (before.daftarTerbuka !== after.daftarTerbuka) {
    changes.push(`Pendaftaran baru ${yesNo(before.daftarTerbuka)} menjadi ${yesNo(after.daftarTerbuka)}`);
  }
  if (before.pemeliharaan.aktif !== after.pemeliharaan.aktif) {
    changes.push(
      `Mode pemeliharaan ${yesNo(before.pemeliharaan.aktif)} menjadi ${yesNo(after.pemeliharaan.aktif)}`,
    );
  } else if (before.pemeliharaan.pesan !== after.pemeliharaan.pesan) {
    changes.push("Pesan pemeliharaan diubah");
  }
  if (JSON.stringify(before.pengumuman) !== JSON.stringify(after.pengumuman)) {
    changes.push(after.pengumuman.teks ? "Pengumuman diubah" : "Pengumuman dihapus");
  }
  if (before.slugCadangan.join(",") !== after.slugCadangan.join(",")) {
    changes.push(`Slug dicadangkan ${before.slugCadangan.length} menjadi ${after.slugCadangan.length} kata`);
  }
  if (before.pesanWaBawaan !== after.pesanWaBawaan) changes.push("Pesan WhatsApp bawaan diubah");
  return changes;
}
