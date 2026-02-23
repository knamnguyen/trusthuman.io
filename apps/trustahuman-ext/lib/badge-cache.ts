/**
 * Badge Lookup Cache
 *
 * Caches profile lookup results to avoid repeated API calls.
 * Uses a simple TTL-based cache stored in memory.
 */

interface CachedResult {
  found: boolean;
  trustProfile?: {
    humanNumber: number;
    username: string;
    totalVerifications: number;
    currentStreak: number;
  };
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CachedResult>();

function getCacheKey(platform: string, profileUrl: string): string {
  return `${platform}:${profileUrl}`;
}

export function getCachedLookup(platform: string, profileUrl: string): CachedResult | null {
  const key = getCacheKey(platform, profileUrl);
  const cached = cache.get(key);

  if (!cached) return null;

  // Check if expired
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return cached;
}

export function setCachedLookup(
  platform: string,
  profileUrl: string,
  result: Omit<CachedResult, "cachedAt">
): void {
  const key = getCacheKey(platform, profileUrl);
  cache.set(key, {
    ...result,
    cachedAt: Date.now(),
  });
}

export function clearCache(): void {
  cache.clear();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.cachedAt > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}, 60_000); // Cleanup every minute
