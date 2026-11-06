/**
 * Abstract Cache Contract
 * Allows zero-refactor swapping between In-Memory, Redis, Memcached, or Cloudflare KV stores.
 */

export interface CacheOptions {
  /** Time to live in milliseconds. Defaults to store default or indefinite */
  ttlMs?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

export interface ICacheStore {
  get<T>(key: string): Promise<T | null> | (T | null);
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void> | void;
  delete(key: string): Promise<boolean> | boolean;
  clear(): Promise<void> | void;
  has(key: string): Promise<boolean> | boolean;
  getStats?(): CacheStats;
}
