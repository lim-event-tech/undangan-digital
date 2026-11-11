"use client";

import { useActionState } from "react";
import { pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import { lewatiUndanganAction, terimaUndanganAction, type TerimaState } from "./actions";

export function FormTerima({ token }: { token: string }) {
  const [hasil, aksi, memproses] = useActionState<TerimaState, FormData>(terimaUndanganAction.bind(null, token), null);
  return (
    <div className="flex flex-col gap-3">
      <form action={aksi} className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={memproses} className={tombolGelap}>{memproses ? "Memproses…" : "Terima dan bergabung"}</button>
      </form>
      <form action={lewatiUndanganAction}>
        <button type="submit" className={tombolTerang}>Nanti saja</button>
      </form>
      {hasil ? <p role="alert" className={`m-0 ${pesanGalat}`}>{hasil.error}</p> : null}
    </div>
  );
}

export function TombolLewati() {
  return (
    <form action={lewatiUndanganAction}>
      <button type="submit" className={tombolTerang}>Lanjut ke undangan saya</button>
    </form>
  );
}
