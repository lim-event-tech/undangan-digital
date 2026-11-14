"use client";

import { useState } from "react";
import { tombolGelap, tombolTerang } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

async function mulaiGoogle(token: string): Promise<string | null> {
  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: `/terima/${token}/gabung`,
    errorCallbackURL: `/terima/${token}?galat=oauth`,
    requestSignUp: true,
  });
  return error ? "Tidak bisa memulai login Google. Coba lagi sebentar." : null;
}

export function TombolTerimaGoogle({
  token,
  gantiAkun = false,
}: {
  token: string;
  gantiAkun?: boolean;
}) {
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function lanjut() {
    setMemproses(true);
    setGalat(null);
    if (gantiAkun) {
      await authClient.signOut();
    }
    const pesan = await mulaiGoogle(token);
    if (!pesan) return;
    setGalat(pesan);
    setMemproses(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={lanjut} disabled={memproses} className={`${tombolGelap} min-h-12 w-full`}>
        {memproses
          ? "Mengarahkan ke Google…"
          : gantiAkun
            ? "Ganti akun & terima dengan Google"
            : "Terima undangan"}
      </button>
      {galat ? <p role="alert" className="m-0 text-[13px] font-medium text-galat">{galat}</p> : null}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-redup">
        <a href={`/terima/${token}/mulai?ke=masuk`} className="underline">Pakai email dan kata sandi</a>
        <a href={`/terima/${token}/mulai?ke=daftar`} className="underline">Buat akun baru</a>
      </div>
    </div>
  );
}

export function TombolManual({ token }: { token: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={`/terima/${token}/mulai?ke=masuk`} className={`${tombolGelap} no-underline`}>Masuk untuk bergabung</a>
      <a href={`/terima/${token}/mulai?ke=daftar`} className={`${tombolTerang} no-underline`}>Buat akun</a>
    </div>
  );
}
