import { logger } from '@/lib/logger';
import { cacheStore, ICacheStore } from '@/lib/cache';

/**
 * BaseService
 * Provides standardized caching hooks, logging, and error wrappers for domain services.
 */
export abstract class BaseService {
  protected cache: ICacheStore;

  constructor(customCache?: ICacheStore) {
    this.cache = customCache || cacheStore;
  }

  /**
   * Automatically caches the output of an async operation with a specific key and TTL
   */
  protected async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== null && cached !== undefined) {
      logger.debug(`Cache HIT for key: ${key}`, this.constructor.name);
      return cached;
    }

    logger.debug(`Cache MISS for key: ${key}`, this.constructor.name);
    const fresh = await fetcher();
    await this.cache.set(key, fresh, { ttlMs });
    return fresh;
  }
}
