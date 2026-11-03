"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BidangAuth, BidangKataSandi } from "@/components/bidang-auth";
import { tombolGelap } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { authMessage } from "@/lib/auth-messages";

export function FormMasukAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function masuk(event: React.FormEvent) {
    event.preventDefault();
    setMemproses(true);
    setGalat(null);

    const { data, error } = await authClient.signIn.email({
      email: email.trim(),
      password: kataSandi,
    });
    if (error) {
      setGalat(authMessage(error));
      setMemproses(false);
      return;
    }
    const peran = (data?.user as { adminRole?: string | null } | undefined)?.adminRole;
    if (!peran) {
      await authClient.signOut();
      router.replace("/admin/masuk?galat=bukan");
      router.refresh();
      setMemproses(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={masuk} className="flex flex-col gap-4">
      <BidangAuth
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={setEmail}
        disabled={memproses}
      />
      <BidangKataSandi
        label="Kata sandi"
        name="kataSandi"
        autoComplete="current-password"
        required
        value={kataSandi}
        onChange={setKataSandi}
        disabled={memproses}
      />
      {galat ? (
        <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat">
          {galat}
        </p>
      ) : null}
      <button type="submit" disabled={memproses} className={`${tombolGelap} min-h-12 w-full`}>
        {memproses ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
