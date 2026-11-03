import type { FieldErrors } from "@/lib/save-result";

export const WA_LIMITS = {
  jedaMinimum: 10,
  jedaMaksimum: 600,
  batasHarianMin: 1,
  batasHarianMaks: 2000,
} as const;

export type WaConfig = {
  aktif: boolean;
  jedaMin: number;
  jedaMaks: number;
  batasHarian: number;
  sambungOtomatis: boolean;
};

export const DEFAULT_WA_CONFIG: WaConfig = {
  aktif: false,
  jedaMin: 15,
  jedaMaks: 30,
  batasHarian: 150,
  sambungOtomatis: false,
};

function integer(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function readWaConfig(raw: unknown): WaConfig {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const jedaMin = integer(
    source.jedaMin,
    DEFAULT_WA_CONFIG.jedaMin,
    WA_LIMITS.jedaMinimum,
    WA_LIMITS.jedaMaksimum,
  );
  const jedaMaks = Math.max(
    jedaMin,
    integer(source.jedaMaks, DEFAULT_WA_CONFIG.jedaMaks, WA_LIMITS.jedaMinimum, WA_LIMITS.jedaMaksimum),
  );
  return {
    aktif: typeof source.aktif === "boolean" ? source.aktif : DEFAULT_WA_CONFIG.aktif,
    jedaMin,
    jedaMaks,
    batasHarian: integer(
      source.batasHarian,
      DEFAULT_WA_CONFIG.batasHarian,
      WA_LIMITS.batasHarianMin,
      WA_LIMITS.batasHarianMaks,
    ),
    sambungOtomatis:
      typeof source.sambungOtomatis === "boolean"
        ? source.sambungOtomatis
        : DEFAULT_WA_CONFIG.sambungOtomatis,
  };
}

function wholeNumber(formData: FormData, name: string): number | null {
  const value = formData.get(name);
  if (typeof value !== "string" || !/^\d{1,5}$/.test(value.trim())) return null;
  return Number(value.trim());
}

export type WaFormInput = Pick<WaConfig, "aktif" | "jedaMin" | "jedaMaks" | "batasHarian">;

export function parseWaForm(
  formData: FormData,
): { ok: true; input: WaFormInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const rangeText = `${WA_LIMITS.jedaMinimum} sampai ${WA_LIMITS.jedaMaksimum} detik`;

  const jedaMin = wholeNumber(formData, "jedaMin");
  if (jedaMin === null || jedaMin < WA_LIMITS.jedaMinimum || jedaMin > WA_LIMITS.jedaMaksimum) {
    errors.jedaMin = `Isi ${rangeText}`;
  }
  const jedaMaks = wholeNumber(formData, "jedaMaks");
  if (jedaMaks === null || jedaMaks < WA_LIMITS.jedaMinimum || jedaMaks > WA_LIMITS.jedaMaksimum) {
    errors.jedaMaks = `Isi ${rangeText}`;
  } else if (jedaMin !== null && !errors.jedaMin && jedaMaks < jedaMin) {
    errors.jedaMaks = "Jeda terlama tidak boleh lebih kecil dari jeda tercepat";
  }
  const batasHarian = wholeNumber(formData, "batasHarian");
  if (
    batasHarian === null ||
    batasHarian < WA_LIMITS.batasHarianMin ||
    batasHarian > WA_LIMITS.batasHarianMaks
  ) {
    errors.batasHarian = `Isi ${WA_LIMITS.batasHarianMin} sampai ${WA_LIMITS.batasHarianMaks} pesan`;
  }

  if (Object.keys(errors).length > 0 || jedaMin === null || jedaMaks === null || batasHarian === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    input: { aktif: formData.get("aktif") !== null, jedaMin, jedaMaks, batasHarian },
  };
}

export function describeWaChanges(before: WaConfig, after: WaConfig): string[] {
  const changes: string[] = [];
  if (before.aktif !== after.aktif) {
    changes.push(`Kirim otomatis untuk pasangan ${after.aktif ? "diaktifkan" : "dimatikan"}`);
  }
  if (before.jedaMin !== after.jedaMin || before.jedaMaks !== after.jedaMaks) {
    changes.push(`Jeda antar pesan ${after.jedaMin} sampai ${after.jedaMaks} detik`);
  }
  if (before.batasHarian !== after.batasHarian) {
    changes.push(`Batas per pasangan per 24 jam ${before.batasHarian} menjadi ${after.batasHarian} pesan`);
  }
  return changes;
}

export function randomDelayMs(config: WaConfig, random: () => number = Math.random): number {
  const min = Math.max(WA_LIMITS.jedaMinimum, config.jedaMin);
  const max = Math.max(min, config.jedaMaks);
  return Math.round((min + random() * (max - min)) * 1000);
}

export function estimateMinutes(count: number, config: WaConfig): number {
  const min = Math.max(WA_LIMITS.jedaMinimum, config.jedaMin);
  const max = Math.max(min, config.jedaMaks);
  return Math.max(1, Math.ceil((count * ((min + max) / 2)) / 60));
}
