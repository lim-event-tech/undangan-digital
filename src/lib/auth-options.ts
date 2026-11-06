import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@/db/schema";
import type { AppDb } from "@/db/types";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import { getSettings } from "@/lib/platform/service";
import { googleCallbackUrl } from "@/lib/google-callback";
import { lingkarideSso } from "@/lib/sso-plugin";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function authOptions(database: AppDb) {
  return {
    database: drizzleAdapter(database, { provider: "pg", schema }),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirectURI: googleCallbackUrl(),
        disableImplicitSignUp: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
    },
    user: {
      additionalFields: {
        status: {
          type: "string",
          required: false,
          defaultValue: "aktif",
          input: false,
        },
        adminRole: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async () => {
            const settings = await getSettings(database);
            if (!settings.daftarTerbuka) {
              throw new APIError("FORBIDDEN", {
                code: "PENDAFTARAN_DITUTUP",
                message: "Pendaftaran akun baru sedang ditutup.",
              });
            }
          },
        },
      },
    },
    plugins: [lingkarideSso(database), nextCookies()],
  } satisfies BetterAuthOptions;
}
