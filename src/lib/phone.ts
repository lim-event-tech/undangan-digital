export type PhoneResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function normalizePhone(input: string): PhoneResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Nomor WhatsApp kosong" };

  const digits = raw.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Nomor WhatsApp tidak valid" };

  let national: string;
  if (raw.startsWith("+") || digits.startsWith("00")) {
    const international = digits.startsWith("00") ? digits.slice(2) : digits;
    if (!international.startsWith("62")) {
      return { ok: false, error: "Hanya nomor Indonesia (+62) yang didukung" };
    }
    national = international.slice(2);
  } else if (digits.startsWith("62")) {
    national = digits.slice(2);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.startsWith("8")) {
    national = digits;
  } else {
    return { ok: false, error: "Format nomor tidak dikenali" };
  }

  national = national.replace(/^0+/, "");

  if (!national.startsWith("8")) {
    return {
      ok: false,
      error: "Bukan nomor seluler (harus diawali 8 setelah +62)",
    };
  }
  if (national.length < 9) return { ok: false, error: "Nomor terlalu pendek" };
  if (national.length > 12) return { ok: false, error: "Nomor terlalu panjang" };

  return { ok: true, value: `+62${national}` };
}

export function formatPhone(value: string): string {
  if (!value.startsWith("+62")) return value;
  const n = value.slice(3);
  const parts = [n.slice(0, 3), n.slice(3, 7), n.slice(7)].filter(Boolean);
  return `+62 ${parts.join("-")}`;
}

export function phoneSearchNeedle(query: string): string {
  let digits = query.replace(/\D/g, "");
  if (digits.startsWith("62") && digits.length >= 5) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  return digits.length >= 3 ? digits : "";
}
