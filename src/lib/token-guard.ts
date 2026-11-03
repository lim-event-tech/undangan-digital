export type TokenGuardOptions = {
  maxFailures: number;
  windowMs: number;
  maxTracked: number;
};

export const TOKEN_GUARD_DEFAULTS: TokenGuardOptions = {
  maxFailures: 10,
  windowMs: 10 * 60 * 1000,
  maxTracked: 5000,
};

export class TokenGuard {
  private readonly failures = new Map<string, number[]>();

  constructor(private readonly options: TokenGuardOptions = TOKEN_GUARD_DEFAULTS) {}

  private recent(key: string, now: number): number[] {
    const list = this.failures.get(key);
    if (!list) return [];
    const cutoff = now - this.options.windowMs;
    const kept = list.filter((time) => time > cutoff);
    if (kept.length === 0) this.failures.delete(key);
    else if (kept.length !== list.length) this.failures.set(key, kept);
    return kept;
  }

  isBlocked(key: string, now: number = Date.now()): boolean {
    return this.recent(key, now).length >= this.options.maxFailures;
  }

  retryAfterSeconds(key: string, now: number = Date.now()): number {
    const list = this.recent(key, now);
    if (list.length < this.options.maxFailures) return 0;
    const releaseAt = list[list.length - this.options.maxFailures] + this.options.windowMs;
    return Math.max(1, Math.ceil((releaseAt - now) / 1000));
  }

  recordFailure(key: string, now: number = Date.now()): void {
    const list = this.recent(key, now);
    list.push(now);
    this.failures.set(key, list);
    if (this.failures.size > this.options.maxTracked) this.prune(now);
  }

  reset(key: string): void {
    this.failures.delete(key);
  }

  private prune(now: number): void {
    for (const key of [...this.failures.keys()]) this.recent(key, now);
    while (this.failures.size > this.options.maxTracked) {
      const oldest = this.failures.keys().next();
      if (oldest.done) break;
      this.failures.delete(oldest.value);
    }
  }
}

export function clientKey(forwardedFor: string | null, realIp: string | null): string {
  const forwarded = forwardedFor
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const candidate = forwarded?.[forwarded.length - 1] ?? realIp?.trim() ?? "";
  return candidate.slice(0, 64) || "tidak-diketahui";
}
