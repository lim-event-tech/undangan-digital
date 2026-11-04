"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BidangAuth, BidangKataSandi } from "@/components/bidang-auth";
import { Ikon } from "@/components/ikon";
import { kartu, tombolGelap, tombolTerang } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import { googleLinkMessage } from "@/lib/account-settings/shared";
import type { SaveResult } from "@/lib/save-result";
import { ubahEmailAction, ubahKataSandiAction } from "./actions";

function Hasil({ result, success }: { result: SaveResult | null; success: string }) {
  if (!result || (!result.ok && !result.formError)) return null;
  return (
    <p role={result.ok ? "status" : "alert"} className={`m-0 rounded-md p-3 text-[13px] leading-relaxed ${result.ok ? "bg-hijau-bg text-hijau" : "bg-galat-bg text-galat"}`}>
      {result.ok ? success : result.formError}
    </p>
  );
}

export function FormAkun({
  email: currentEmail,
  hasPassword,
  googleConnected,
  googleAvailable,
  googleMessage,
  googleError,
}: {
  email: string;
  hasPassword: boolean;
  googleConnected: boolean;
  googleAvailable: boolean;
  googleMessage: string | null;
  googleError: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [emailResult, setEmailResult] = useState<SaveResult | null>(null);
  const [passwordResult, setPasswordResult] = useState<SaveResult | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [pending, setPending] = useState<"email" | "password" | "google" | null>(null);
  const busy = pending !== null;
  const emailErrors = emailResult && !emailResult.ok ? emailResult.errors : undefined;
  const passwordErrors = passwordResult && !passwordResult.ok ? passwordResult.errors : undefined;

  async function submit(event: FormEvent<HTMLFormElement>, kind: "email" | "password") {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const setResult = kind === "email" ? setEmailResult : setPasswordResult;
    setResult(null);
    setPending(kind);
    try {
      const result = await (kind === "email" ? ubahEmailAction(data) : ubahKataSandiAction(data));
      setResult(result);
      if (result.ok) {
        setEmailPassword("");
        setCurrentPassword("");
        setPassword("");
        setConfirmation("");
        router.refresh();
      }
    } catch {
      setResult({ ok: false, formError: "Koneksi terputus. Periksa koneksi Anda lalu coba lagi." });
    } finally {
      setPending(null);
    }
  }

  async function connectGoogle() {
    if (busy) return;
    setPending("google");
    setLinkError(null);
    try {
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/undangan/akun?google=terhubung",
        errorCallbackURL: "/undangan/akun?google=gagal",
        loginHint: currentEmail,
      });
      if (error) {
        setLinkError(googleLinkMessage(error.code));
        setPending(null);
      }
    } catch {
      setLinkError("Koneksi ke Google terputus. Silakan coba lagi.");
      setPending(null);
    }
  }

  return (
    <>
      <section aria-labelledby="judul-email" className={`${kartu} flex flex-col gap-5 p-5 sm:p-7`}>
        <div>
          <h2 id="judul-email" className="m-0 font-judul text-2xl font-medium">Email akun</h2>
          <p className="mt-1 mb-0 text-sm leading-relaxed text-redup-2">
            Email saat ini: <span className="break-all font-medium text-tinta">{currentEmail}</span>
          </p>
        </div>
        {!hasPassword ? (
          <p className="m-0 rounded-md bg-krem p-3 text-sm leading-relaxed text-emas-tua">
            <a href="#kata-sandi" className="font-medium underline underline-offset-2">Buat kata sandi</a> terlebih dahulu untuk mengubah email akun.
          </p>
        ) : (
          <form onSubmit={(event) => submit(event, "email")} className="flex flex-col gap-4">
            <BidangAuth label="Email baru" name="email" type="email" autoComplete="email" required value={email} onChange={setEmail} error={emailErrors?.email} disabled={busy} />
            <BidangKataSandi label="Kata sandi saat ini" name="password" autoComplete="current-password" required value={emailPassword} onChange={setEmailPassword} error={emailErrors?.password} disabled={busy} />
            <Hasil result={emailResult} success="Email berhasil diubah. Gunakan email baru untuk masuk dengan kata sandi." />
            <button type="submit" disabled={busy} className={`${tombolGelap} w-full sm:w-fit`}>
              {pending === "email" ? "Menyimpan…" : "Simpan email"}
            </button>
          </form>
        )}
      </section>

      <section id="kata-sandi" aria-labelledby="judul-kata-sandi" className={`${kartu} flex scroll-mt-5 flex-col gap-5 p-5 sm:p-7`}>
        <div>
          <h2 id="judul-kata-sandi" className="m-0 font-judul text-2xl font-medium">Kata sandi</h2>
          <p className="mt-1 mb-0 text-sm leading-relaxed text-redup-2">
            {hasPassword ? "Ubah kata sandi untuk menjaga keamanan akun Anda." : "Buat kata sandi agar Anda juga dapat masuk menggunakan email."} Setelah disimpan, sesi di perangkat lain akan diakhiri.
          </p>
        </div>
        <form onSubmit={(event) => submit(event, "password")} className="flex flex-col gap-4">
          <input type="hidden" autoComplete="username" name="username" value={currentEmail} />
          {hasPassword ? <BidangKataSandi label="Kata sandi saat ini" name="currentPassword" autoComplete="current-password" required value={currentPassword} onChange={setCurrentPassword} error={passwordErrors?.currentPassword} disabled={busy} /> : null}
          <BidangKataSandi label="Kata sandi baru" name="password" autoComplete="new-password" required value={password} onChange={setPassword} hint={`${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} karakter`} error={passwordErrors?.password} disabled={busy} />
          <BidangKataSandi label="Ulangi kata sandi baru" name="confirmation" autoComplete="new-password" required value={confirmation} onChange={setConfirmation} error={passwordErrors?.confirmation} disabled={busy} />
          <Hasil result={passwordResult} success="Kata sandi berhasil disimpan. Sesi di perangkat lain telah diakhiri." />
          <button type="submit" disabled={busy} className={`${tombolGelap} w-full sm:w-fit`}>
            {pending === "password" ? "Menyimpan…" : hasPassword ? "Simpan kata sandi" : "Buat kata sandi"}
          </button>
        </form>
      </section>

      <section aria-labelledby="judul-google" className={`${kartu} flex flex-col gap-5 p-5 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-google" className="m-0 font-judul text-2xl font-medium">Akun Google</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${googleConnected ? "bg-hijau-bg text-hijau" : "bg-krem-2 text-redup-2"}`}>
            {googleConnected ? "Terhubung" : "Belum terhubung"}
          </span>
        </div>
        <p className="m-0 text-sm leading-relaxed text-redup-2">
          {googleConnected ? "Akun Google Anda sudah terhubung dan dapat digunakan untuk masuk." : "Hubungkan akun Google dengan email yang sama agar Anda dapat masuk lebih mudah."}
        </p>
        {linkError || googleMessage ? <p role={linkError || googleError ? "alert" : "status"} className={`m-0 rounded-md p-3 text-[13px] leading-relaxed ${linkError || googleError ? "bg-galat-bg text-galat" : "bg-hijau-bg text-hijau"}`}>{linkError ?? googleMessage}</p> : null}
        {!googleConnected && googleAvailable ? (
          <button type="button" disabled={busy} onClick={connectGoogle} className={`${tombolTerang} w-full sm:w-fit`}>
            <Ikon nama="tautan" ukuran={16} />
            {pending === "google" ? "Menghubungkan…" : "Hubungkan Google"}
          </button>
        ) : !googleConnected ? <p className="m-0 text-xs leading-relaxed text-redup">Koneksi Google belum tersedia. Silakan coba lagi nanti.</p> : null}
      </section>
    </>
  );
}
