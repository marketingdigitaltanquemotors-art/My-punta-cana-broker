type CacheEntry = { expiresAt: number; value: unknown };

const entries = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 500;

export const SHORT_CACHE_TTL = 30_000;

export async function withMemoryCache<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = entries.get(key);
  if (cached && cached.expiresAt > now) return cached.value as T;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight as Promise<T>;

  const request = load()
    .then(value => {
      if (entries.size >= MAX_ENTRIES) {
        const oldestKey = entries.keys().next().value;
        if (oldestKey) entries.delete(oldestKey);
      }
      entries.set(key, { expiresAt: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => pending.delete(key));

  pending.set(key, request);
  return request;
}

export function invalidateMemoryCache(...prefixes: string[]) {
  for (const key of entries.keys()) {
    if (prefixes.some(prefix => key.startsWith(prefix))) entries.delete(key);
  }
}

export function cachedMediaUrl(key: string) {
  const cacheKey = `media-url:${key}`;
  const cached = entries.get(cacheKey);
  if (cached?.expiresAt && cached.expiresAt > Date.now()) return cached.value as string;
  const value = `/api/content/image?key=${encodeURIComponent(key)}`;
  if (entries.size >= MAX_ENTRIES) {
    const oldestKey = entries.keys().next().value;
    if (oldestKey) entries.delete(oldestKey);
  }
  entries.set(cacheKey, { expiresAt: Date.now() + SHORT_CACHE_TTL, value });
  return value;
}
