"use client";

import { useActionState } from "react";
import {
  kolom,
  labelKolom,
  pesanGalat,
  tombolGelap,
} from "@/components/ui";
import { createInvitationAction, type BaruState } from "./actions";
import { MAX_INVITATION_TITLE } from "@/lib/invitations/title";

const awal: BaruState = {};

export function FormBaru({ template }: { template: string }) {
  const [state, action, memproses] = useActionState(
    createInvitationAction,
    awal,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="template" value={template} />
      <label className={labelKolom}>
        Judul event
        <input
          name="title"
          type="text"
          required
          maxLength={MAX_INVITATION_TITLE}
          autoComplete="off"
          placeholder="mis. Gathering Komunitas 2026"
          defaultValue={state.values?.title ?? ""}
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
