import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { readSsoPayload, SsoError } from "@/lib/sso";

export function lingkarideSso(database: AppDb) {
  return {
    id: "lingkaride-sso",
    endpoints: {
      signInLingkaride: createAuthEndpoint("/lingkaride/sso", { method: "GET", requireHeaders: true }, async (ctx) => {
        ctx.setHeader("Cache-Control", "no-store");
        ctx.setHeader("Referrer-Policy", "no-referrer");
        ctx.setHeader("X-Robots-Tag", "noindex, nofollow");
        let destination = "/undangan";
        try {
          const token = ctx.request ? new URL(ctx.request.url).searchParams.get("token") : null;
          const payload = readSsoPayload(token, ctx.headers.get("referer"));
          const [existing] = await database.select().from(user).where(eq(user.email, payload.email));
          let account = existing;
          if (!account) {
            try {
              const created = await ctx.context.internalAdapter.createUser(
                { email: payload.email, name: payload.name || payload.email.split("@")[0], emailVerified: true },
                { method: "lingkaride-sso" },
              );
              [account] = await database.select().from(user).where(eq(user.id, created.id));
            } catch {
              throw new SsoError("registration_closed");
            }
          }
          if (!account) throw new SsoError("unavailable");
          if (account.status !== "aktif") throw new SsoError("inactive");
          const session = await ctx.context.internalAdapter.createSession(account.id);
          if (!session) throw new SsoError("unavailable");
          await setSessionCookie(ctx, { session, user: account });
          if (account.adminRole) {
            ctx.setCookie("ud_kelola", "", { path: "/", maxAge: 0 });
            destination = "/admin";
          }
        } catch (error) {
          const code = error instanceof SsoError ? error.message : "sso_unavailable";
          destination = `/admin/masuk?galat=${code}`;
        }
        throw ctx.redirect(new URL(destination, ctx.context.baseURL).href);
      }),
    },
    rateLimit: [{ pathMatcher: (path) => path === "/lingkaride/sso", window: 60, max: 20 }],
  } satisfies BetterAuthPlugin;
}
