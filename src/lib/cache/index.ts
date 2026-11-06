import { MemoryCacheStore } from './memory-cache';
import { ICacheStore } from './cache-store.interface';

/**
 * Singleton cache instance with default memory store.
 * In production/distributed clusters, switch to a RedisCacheStore adapter seamlessly.
 */
export const cacheStore: ICacheStore = new MemoryCacheStore({
  maxEntries: 5000,
  defaultTtlMs: 10 * 60 * 1000, // 10 minutes
});

export * from './cache-store.interface';
export * from './memory-cache';
