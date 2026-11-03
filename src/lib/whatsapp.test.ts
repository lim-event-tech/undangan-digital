import { describe, expect, it } from "vitest";
import {
  DEFAULT_MESSAGE,
  MAX_MESSAGE_LENGTH,
  checkMessageTemplate,
  deadlinePhrase,
  renderMessage,
  whatsappLink,
} from "./whatsapp";

const vars = {
  nama: "Bapak Hendra & Istri",
  link: "https://undangan.example.com/u/raka-dan-nadia/AbCdEfGh12345678",
  batas_rsvp: "sebelum 10 Desember 2026",
  mempelai: "Raka & Nadia",
};

describe("renderMessage", () => {
  it("mengganti semua sisipan, termasuk yang muncul berulang", () => {
    const text = renderMessage("{nama} - {nama} - {mempelai} - {batas_rsvp}\n{link}", vars);
    expect(text).toBe(
      "Bapak Hendra & Istri - Bapak Hendra & Istri - Raka & Nadia - sebelum 10 Desember 2026\nhttps://undangan.example.com/u/raka-dan-nadia/AbCdEfGh12345678",
    );
  });

  it("membiarkan sisipan yang tidak dikenal dan tidak menafsirkan isi nama sebagai sisipan", () => {
    expect(renderMessage("{tidak_dikenal} {nama}", { ...vars, nama: "{link}" })).toBe(
      "{tidak_dikenal} {link}",
    );
  });

  it("pesan bawaan memuat link dan terbaca utuh setelah diisi", () => {
    const text = renderMessage(DEFAULT_MESSAGE, vars);
    expect(text).toContain("Yth. Bapak Hendra & Istri,");
    expect(text).toContain(vars.link);
    expect(text).toContain("Mohon konfirmasi kehadiran sebelum 10 Desember 2026.");
    expect(text).not.toMatch(/\{[a-z_]+\}/);
  });
});

describe("deadlinePhrase", () => {
  it("memakai kata secepatnya bila tanpa batas waktu", () => {
    expect(deadlinePhrase("10 Desember 2026")).toBe("sebelum 10 Desember 2026");
    expect(deadlinePhrase(null)).toBe("secepatnya");
  });
});

describe("whatsappLink", () => {
  it("memakai angka nomor saja dan mengodekan pesan", () => {
    const link = whatsappLink("+6281234567890", "Halo & selamat!\nBaris 2");
    expect(link).toBe("https://wa.me/6281234567890?text=Halo%20%26%20selamat!%0ABaris%202");
  });
});

describe("checkMessageTemplate", () => {
  it("menerima pesan kosong sebagai tanda memakai pesan bawaan", () => {
    expect(checkMessageTemplate("   ")).toEqual({ ok: true, template: "" });
  });

  it("mewajibkan sisipan link", () => {
    const result = checkMessageTemplate("Halo {nama}, ada undangan untuk Anda.");
    expect(result.ok).toBe(false);
    expect(checkMessageTemplate("Halo {nama}, buka {link}")).toEqual({
      ok: true,
      template: "Halo {nama}, buka {link}",
    });
  });

  it("menolak pesan yang terlalu panjang dan menyeragamkan baris baru", () => {
    expect(checkMessageTemplate(`{link}${"a".repeat(MAX_MESSAGE_LENGTH)}`).ok).toBe(false);
    expect(checkMessageTemplate("Halo\r\n{link}")).toEqual({ ok: true, template: "Halo\n{link}" });
  });
});
