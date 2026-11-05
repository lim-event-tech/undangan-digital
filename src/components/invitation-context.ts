"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { isUuid } from "@/lib/uuid";

export function useInvitationId(): string {
  const { id } = useParams();
  if (!isUuid(id)) throw new Error("Konteks undangan tidak tersedia.");
  return id.toLowerCase();
}

export function useInvitationAction<Args extends unknown[], Result>(
  action: (invitationId: string, ...args: Args) => Result,
): (...args: Args) => Result {
  const id = useInvitationId();
  return useMemo(() => (...args: Args) => action(id, ...args), [action, id]);
}
