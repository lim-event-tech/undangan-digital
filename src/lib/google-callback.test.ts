import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardGoogleCallback, googleCallbackUrl } from "./google-callback";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("googleCallbackUrl", () => {
  it("memakai path yang sama dengan WordCLD pada domain publik", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://3000.hantupenyiar.my.id/");
    expect(googleCallbackUrl()).toBe("https://3000.hantupenyiar.my.id/api/auth/google/callback");
  });

  it("tetap mendukung pengembangan lokal tanpa konfigurasi URL", () => {
    vi.stubEnv("BETTER_AUTH_URL", undefined);
    expect(googleCallbackUrl()).toBe("http://localhost:3000/api/auth/google/callback");
  });
});

describe("forwardGoogleCallback", () => {
  it("meneruskan kode, state, dan cookie ke handler Better Auth pada origin yang sama", () => {
    const request = new Request("https://3000.hantupenyiar.my.id/api/auth/google/callback?code=kode-uji&state=state-uji&scope=openid+email", {
      headers: { cookie: "oauth_state=state-uji", "x-forwarded-proto": "https" },
    });
    const forwarded = forwardGoogleCallback(request);
    expect(forwarded.url).toBe("https://3000.hantupenyiar.my.id/api/auth/callback/google?code=kode-uji&state=state-uji&scope=openid+email");
    expect(forwarded.headers.get("cookie")).toBe("oauth_state=state-uji");
    expect(forwarded.headers.get("x-forwarded-proto")).toBe("https");
    expect(request.url).toContain("/api/auth/google/callback?");
  });

  it("mempertahankan metode dan isi callback POST", async () => {
    const request = new Request("https://3000.hantupenyiar.my.id/api/auth/google/callback", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: "oauth_state=state-uji" },
      body: new URLSearchParams({ code: "kode-uji", state: "state-uji" }),
    });
    const forwarded = forwardGoogleCallback(request);
    expect(forwarded.method).toBe("POST");
    expect(forwarded.headers.get("cookie")).toBe("oauth_state=state-uji");
    expect(new URLSearchParams(await forwarded.text()).get("state")).toBe("state-uji");
  });
});
