"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { INVITE_COOKIE } from "@/lib/token";

export async function lewatiUndanganAction(): Promise<void> {
  (await cookies()).delete(INVITE_COOKIE);
  redirect("/undangan");
}
