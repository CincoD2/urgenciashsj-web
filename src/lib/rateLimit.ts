type RateLimitConfig = {
  maxFailures: number;
  windowMs: number;
  blockMs: number;
};

type RateLimitEntry = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
};

const globalStore = globalThis as typeof globalThis & {
  __urgenciashsjRateLimitStore?: Map<string, RateLimitEntry>;
};

function getStore() {
  if (!globalStore.__urgenciashsjRateLimitStore) {
    globalStore.__urgenciashsjRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalStore.__urgenciashsjRateLimitStore;
}

function buildKey(namespace: string, key: string) {
  return `${namespace}:${key}`;
}

function pruneExpiredEntries(now: number) {
  const store = getStore();
  for (const [key, entry] of store.entries()) {
    const windowExpired = now - entry.windowStartedAt > 24 * 60 * 60 * 1000;
    const blockExpired = entry.blockedUntil > 0 && entry.blockedUntil <= now;
    if (windowExpired && (entry.failures === 0 || blockExpired)) {
      store.delete(key);
    }
  }
}

function getActiveEntry(namespace: string, key: string, config: RateLimitConfig, now: number) {
  const store = getStore();
  const storeKey = buildKey(namespace, key);
  const entry = store.get(storeKey);

  if (!entry) {
    return {
      store,
      storeKey,
      entry: {
        failures: 0,
        windowStartedAt: now,
        blockedUntil: 0,
      },
    };
  }

  if (now - entry.windowStartedAt > config.windowMs) {
    entry.failures = 0;
    entry.windowStartedAt = now;
  }

  if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
    entry.blockedUntil = 0;
    entry.failures = 0;
    entry.windowStartedAt = now;
  }

  return { store, storeKey, entry };
}

export function getRateLimitStatus(namespace: string, key: string, config: RateLimitConfig) {
  const now = Date.now();
  pruneExpiredEntries(now);
  const { entry } = getActiveEntry(namespace, key, config, now);

  if (entry.blockedUntil > now) {
    return {
      limited: true,
      retryAfterMs: entry.blockedUntil - now,
    };
  }

  return {
    limited: false,
    retryAfterMs: 0,
  };
}

export function recordRateLimitFailure(namespace: string, key: string, config: RateLimitConfig) {
  const now = Date.now();
  pruneExpiredEntries(now);
  const { store, storeKey, entry } = getActiveEntry(namespace, key, config, now);

  entry.failures += 1;
  if (entry.failures >= config.maxFailures) {
    entry.blockedUntil = now + config.blockMs;
    entry.failures = 0;
    entry.windowStartedAt = now;
  }

  store.set(storeKey, entry);

  return entry.blockedUntil > now
    ? {
        limited: true,
        retryAfterMs: entry.blockedUntil - now,
      }
    : {
        limited: false,
        retryAfterMs: 0,
      };
}

export function clearRateLimit(namespace: string, key: string) {
  getStore().delete(buildKey(namespace, key));
}
