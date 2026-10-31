"use client";

import { useActionState } from "react";
import {
  kolom,
  labelKolom,
  pesanGalat,
  tombolGelap,
} from "@/components/ui";
import { createInvitationAction, type BaruState } from "./actions";

const awal: BaruState = {};

export function FormBaru() {
  const [state, action, memproses] = useActionState(
    createInvitationAction,
    awal,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={labelKolom}>
        Nama panggilan mempelai pria
        <input
          name="pria"
          type="text"
          required
          maxLength={40}
          autoComplete="off"
          placeholder="mis. Raka"
          defaultValue={state.values?.pria ?? ""}
          className={kolom}
        />
      </label>
      <label className={labelKolom}>
        Nama panggilan mempelai wanita
        <input
          name="wanita"
          type="text"
          required
          maxLength={40}
          autoComplete="off"
          placeholder="mis. Nadia"
          defaultValue={state.values?.wanita ?? ""}
          className={kolom}
        />
      </label>
      {state.error ? (
        <p role="alert" className={`m-0 ${pesanGalat}`}>
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={memproses} className={`${tombolGelap} min-h-12`}>
        {memproses ? "Membuat…" : "Buat undangan"}
      </button>
    </form>
  );
}
