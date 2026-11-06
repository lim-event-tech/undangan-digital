import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { adminRole, user } from "@/db/schema";
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
        let destination = "/admin";
        try {
          const token = ctx.request ? new URL(ctx.request.url).searchParams.get("token") : null;
          const payload = readSsoPayload(token, ctx.headers.get("referer"));
          const [row] = await database.select({ user }).from(user)
            .innerJoin(adminRole, eq(adminRole.key, user.adminRole))
            .where(eq(user.email, payload.email));
          if (!row) throw new SsoError("not_registered");
          if (row.user.status !== "aktif") throw new SsoError("inactive");
          const session = await ctx.context.internalAdapter.createSession(row.user.id);
          if (!session) throw new SsoError("unavailable");
          await setSessionCookie(ctx, { session, user: row.user });
          ctx.setCookie("ud_kelola", "", { path: "/", maxAge: 0 });
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
