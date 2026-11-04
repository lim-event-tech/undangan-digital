import { describe, expect, it } from "vitest";
import { googleLinkMessage, parseAccountPassword } from "./shared";

describe("validasi pengaturan akun", () => {
  it.each(["pendek", "a".repeat(129)])("menolak panjang kata sandi di luar batas", (password) => {
    const form = new FormData();
    form.set("password", password);
    form.set("confirmation", password);
    expect(parseAccountPassword(form)).toMatchObject({ ok: false, errors: { password: expect.any(String) } });
  });

  it("memvalidasi konfirmasi tanpa memangkas spasi dalam kata sandi", () => {
    const form = new FormData();
    form.set("password", "  sandi-aman  ");
    form.set("confirmation", "sandi-aman");
    expect(parseAccountPassword(form)).toMatchObject({ ok: false, errors: { confirmation: expect.any(String) } });
    form.set("confirmation", "  sandi-aman  ");
    expect(parseAccountPassword(form)).toMatchObject({ ok: true, password: "  sandi-aman  " });
  });

  it("tidak menampilkan pesan mentah dari callback Google", () => {
    expect(googleLinkMessage("<script>rahasia</script>")).not.toContain("script");
    expect(googleLinkMessage("email_does_not_match")).toContain("email yang sama");
    expect(googleLinkMessage("account_already_linked_to_different_user")).toContain("pengguna lain");
  });
});
