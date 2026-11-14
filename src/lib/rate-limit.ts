import "server-only";

/**
 * Rate limit login sederhana di memori proses.
 * Catatan: pada serverless, memori tidak dibagi antar-instance. Ini tetap
 * memperlambat brute force per-instance; untuk skala lebih besar gunakan
 * Upstash Redis / tabel khusus.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

export function consumeRateLimit(
  key: string,
  limit = 6,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60 * 1000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
    lastCleanup = now;
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
