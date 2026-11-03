"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { tombolTerang } from "@/components/ui";

function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export function TombolGoogle({ siap, admin = false }: { siap: boolean; admin?: boolean }) {
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function masuk() {
    setMemproses(true);
    setGalat(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      ...(admin
        ? { callbackURL: "/admin", errorCallbackURL: "/admin/masuk?galat=google" }
        : { callbackURL: "/undangan", errorCallbackURL: "/masuk?galat=oauth", requestSignUp: true }),
    });
    if (error) {
      setGalat("Tidak bisa memulai login Google. Coba lagi sebentar.");
      setMemproses(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={masuk}
        disabled={!siap || memproses}
        className={`${tombolTerang} min-h-12 w-full`}
      >
        <LogoGoogle />
        {memproses ? "Mengarahkan ke Google…" : admin ? "Masuk admin dengan Google" : "Lanjut dengan Google"}
      </button>
      {!siap ? (
        <p
          role="status"
          className="m-0 rounded-md bg-jingga-bg p-3 text-[13px] leading-relaxed text-jingga"
        >
          Login Google belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan
          GOOGLE_CLIENT_SECRET di .env, lalu mulai ulang server.
        </p>
      ) : null}
      {galat ? (
        <p role="alert" className="m-0 text-[13px] font-medium text-galat">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
