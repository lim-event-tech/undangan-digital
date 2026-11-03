"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BidangAuth, BidangKataSandi } from "@/components/bidang-auth";
import { tombolGelap } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import { authMessage, passwordProblem } from "@/lib/auth-messages";

type Galat = Partial<Record<"nama" | "email" | "kataSandi" | "konfirmasi", string>>;

export function FormDaftar() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [galat, setGalat] = useState<Galat>({});
  const [galatUmum, setGalatUmum] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);

  async function daftar(event: React.FormEvent) {
    event.preventDefault();
    const bersih = { nama: nama.replace(/\s+/g, " ").trim(), email: email.trim() };
    const baru: Galat = {};
    if (!bersih.nama) baru.nama = "Nama wajib diisi.";
    else if (bersih.nama.length > 80) baru.nama = "Nama maksimal 80 karakter.";
    const masalah = passwordProblem(kataSandi);
    if (masalah) baru.kataSandi = masalah;
    if (kataSandi !== konfirmasi) baru.konfirmasi = "Konfirmasi kata sandi tidak sama.";
    setGalat(baru);
    setGalatUmum(null);
    if (Object.keys(baru).length > 0) return;

    setMemproses(true);
    const { error } = await authClient.signUp.email({
      name: bersih.nama,
      email: bersih.email,
      password: kataSandi,
    });
    if (error) {
      if (error.code === "INVALID_EMAIL" || error.code?.startsWith("USER_ALREADY_EXISTS")) {
        setGalat({ email: authMessage(error) });
      } else {
        setGalatUmum(authMessage(error));
      }
      setMemproses(false);
      return;
    }
    router.replace("/undangan");
    router.refresh();
  }

  return (
    <form onSubmit={daftar} className="flex flex-col gap-4">
      <BidangAuth
        label="Nama"
        name="nama"
        autoComplete="name"
        required
        value={nama}
        onChange={setNama}
        error={galat.nama}
        disabled={memproses}
      />
      <BidangAuth
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={setEmail}
        error={galat.email}
        disabled={memproses}
      />
      <BidangKataSandi
        label="Kata sandi"
        name="kataSandi"
        autoComplete="new-password"
        required
        value={kataSandi}
        onChange={setKataSandi}
        hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
        error={galat.kataSandi}
        disabled={memproses}
      />
      <BidangKataSandi
        label="Ulangi kata sandi"
        name="konfirmasi"
        autoComplete="new-password"
        required
        value={konfirmasi}
        onChange={setKonfirmasi}
        error={galat.konfirmasi}
        disabled={memproses}
      />

      {galatUmum ? (
        <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat">
          {galatUmum}
        </p>
      ) : null}

      <button type="submit" disabled={memproses} className={`${tombolGelap} min-h-12 w-full`}>
        {memproses ? "Mendaftar…" : "Daftar"}
      </button>

      <p className="m-0 text-center text-[13px] text-redup">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-medium text-emas">
          Masuk
        </Link>
      </p>
    </form>
  );
}
