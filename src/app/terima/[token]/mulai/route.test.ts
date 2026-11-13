import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INVITE_COOKIE } from "@/lib/token";

const cookieSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: cookieSet })),
}));

import { GET } from "./route";

const VALID_TOKEN = "aB3dE6gH9jK2mN5pQ8sT1vW4yZ7cF0hJ";

beforeEach(() => {
  cookieSet.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /terima/[token]/mulai", () => {
  it("mengarahkan ke BETTER_AUTH_URL meskipun request.url memakai 0.0.0.0", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://rsvp.lingkaride.com");
    const request = new Request(`http://0.0.0.0:3000/terima/${VALID_TOKEN}/mulai?ke=masuk`);
    const response = await GET(request, { params: Promise.resolve({ token: VALID_TOKEN }) });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://rsvp.lingkaride.com/masuk");
    expect(cookieSet).toHaveBeenCalledWith(INVITE_COOKIE, VALID_TOKEN, expect.objectContaining({ httpOnly: true, path: "/" }));
  });

  it("mengarahkan ke /daftar saat parameter ke=daftar", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://rsvp.lingkaride.com");
    const request = new Request(`http://0.0.0.0:3000/terima/${VALID_TOKEN}/mulai?ke=daftar`);
    const response = await GET(request, { params: Promise.resolve({ token: VALID_TOKEN }) });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://rsvp.lingkaride.com/daftar");
    expect(cookieSet).toHaveBeenCalledTimes(1);
  });

  it("mengarahkan token tidak valid ke /masuk pada BETTER_AUTH_URL tanpa menyetel cookie", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://rsvp.lingkaride.com");
    const request = new Request("http://0.0.0.0:3000/terima/token-palsu/mulai?ke=daftar");
    const response = await GET(request, { params: Promise.resolve({ token: "token-palsu" }) });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://rsvp.lingkaride.com/masuk");
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

