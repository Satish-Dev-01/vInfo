import { ICacheStore, CacheOptions, CacheStats } from './cache-store.interface';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  lastAccessed: number;
}

export class MemoryCacheStore implements ICacheStore {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;
  private defaultTtlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(options: { maxEntries?: number; defaultTtlMs?: number } = {}) {
    this.maxEntries = options.maxEntries ?? 1000;
    this.defaultTtlMs = options.defaultTtlMs ?? 5 * 60 * 1000; // 5 mins default
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    this.hits++;
    return entry.value;
  }

  set<T>(key: string, value: T, options?: CacheOptions): void {
    // Evict oldest accessed if capacity reached to avoid memory leaks
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest();
    }

    const ttl = options?.ttlMs ?? this.defaultTtlMs;
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;

    this.store.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  has(key: string): boolean {
    const value = this.get(key);
    return value !== null;
  }

  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      maxSize: this.maxEntries,
    };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [k, v] of this.store.entries()) {
      if (v.lastAccessed < oldestAccess) {
        oldestAccess = v.lastAccessed;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}
