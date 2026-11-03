import { headers } from "next/headers";
import { TokenGuard, clientKey } from "@/lib/token-guard";

const globalForGuard = globalThis as unknown as { tokenGuard?: TokenGuard };

export const tokenGuard = (globalForGuard.tokenGuard ??= new TokenGuard());

export async function currentClientKey(): Promise<string> {
  const list = await headers();
  return clientKey(list.get("x-forwarded-for"), list.get("x-real-ip"));
}
