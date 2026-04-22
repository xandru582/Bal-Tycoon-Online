// ============================================================
// In-memory sliding-window rate limiter (no extra deps).
// Sufficient for single-node deployments; for horizontal
// scaling, swap the Map for a Redis-backed store.
// ============================================================

import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Keying strategy. Default: req.ip + route path. */
  keyGenerator?: (req: Request) => string;
  /** Message to return on limit. */
  message?: string;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, slow down." } = opts;
  const buckets = new Map<string, Bucket>();

  // Periodic cleanup so stale keys don't pile up.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }, Math.max(windowMs, 60_000));
  // Don't hold the event loop open in tests.
  sweep.unref?.();

  return function rateLimitMw(req: Request, res: Response, next: NextFunction): void {
    const key = opts.keyGenerator
      ? opts.keyGenerator(req)
      : `${req.ip ?? "anon"}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      res.status(429).json({ error: message, retryAfter });
      return;
    }
    next();
  };
}
