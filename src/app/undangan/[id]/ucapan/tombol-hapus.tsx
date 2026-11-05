"use client";

import { useInvitationAction } from "@/components/invitation-context";

import { tombolBahaya } from "@/components/ui";
import { hapusUcapanAction } from "./actions";

export function TombolHapusUcapan({ id, pengirim }: { id: string; pengirim: string }) {
  const hapusUcapanActionForInvitation = useInvitationAction(hapusUcapanAction);

  return (
    <form
      action={hapusUcapanActionForInvitation}
      onSubmit={(event) => {
        if (!window.confirm(`Hapus ucapan dari ${pengirim}? Ucapan yang dihapus tidak bisa dikembalikan.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={`${tombolBahaya} min-h-10 px-3.5`}>
        Hapus
      </button>
    </form>
  );
}
