import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  averageHits: number;
}

interface CacheLayer {
  entries: Map<string, CacheEntry<any>>;
  maxSize: number;
  maxEntries: number;
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: CacheLayer;
  private persistentCache: CacheLayer;
  private hits = 0;
  private misses = 0;

  private constructor() {
    this.memoryCache = {
      entries: new Map(),
      maxSize: 50 * 1024 * 1024, // 50 MB
      maxEntries: 10000,
    };

    this.persistentCache = {
      entries: new Map(),
      maxSize: 100 * 1024 * 1024, // 100 MB
      maxEntries: 50000,
    };
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get from cache (memory first, then persistent)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache
    const memEntry = this.memoryCache.entries.get(key);
    if (memEntry) {
      if (this.isExpired(memEntry)) {
        this.memoryCache.entries.delete(key);
      } else {
        memEntry.hits++;
        this.hits++;
        return memEntry.value as T;
      }
    }

    // Check persistent cache
    const persEntry = this.persistentCache.entries.get(key);
    if (persEntry) {
      if (this.isExpired(persEntry)) {
        this.persistentCache.entries.delete(key);
        await AsyncStorage.removeItem(`cache_${key}`);
      } else {
        persEntry.hits++;
        this.hits++;

        // Promote to memory cache for faster access
        this.memoryCache.entries.set(key, persEntry);
        return persEntry.value as T;
      }
    }

    // Try AsyncStorage directly
    try {
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        const entry = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          entry.hits++;
          this.hits++;

          // Promote to both cache layers
          this.memoryCache.entries.set(key, entry);
          this.persistentCache.entries.set(key, entry);
          return entry.value as T;
        } else {
          await AsyncStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.error(`Failed to get cache for ${key}:`, error);
    }

    this.misses++;
    return null;
  }

  /**
   * Set cache entry (store in both layers)
   */
  async set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    const size = this.estimateSize(value);
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0,
      size,
    };

    // Store in memory cache
    if (this.canFitInCache(this.memoryCache, size)) {
      this.memoryCache.entries.set(key, entry);
    } else {
      // Evict if necessary
      this.evictLRU(this.memoryCache);
      this.memoryCache.entries.set(key, entry);
    }

    // Store in persistent cache
    if (this.canFitInCache(this.persistentCache, size)) {
      this.persistentCache.entries.set(key, entry);
    } else {
      this.evictLRU(this.persistentCache);
      this.persistentCache.entries.set(key, entry);
    }

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error(`Failed to persist cache for ${key}:`, error);
    }
  }

  /**
   * Batch set multiple entries
   */
  async setBatch<T>(entries: Record<string, { value: T; ttl?: number }>): Promise<void> {
    const promises = Object.entries(entries).map(([key, { value, ttl }]) =>
      this.set(key, value, ttl)
    );
    await Promise.all(promises);
  }

  /**
   * Get multiple entries with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await fallback();
    await this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.entries.delete(key);
    this.persistentCache.entries.delete(key);
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error(`Failed to delete cache for ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.entries.clear();
    this.persistentCache.entries.clear();
    this.hits = 0;
    this.misses = 0;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear AsyncStorage cache:', error);
    }
  }

  /**
   * Clear entries by pattern
   */
  async clearByPattern(pattern: RegExp): Promise<void> {
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.entries.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.entries.delete(key);
        keysToDelete.push(key);
      }
    }

    for (const key of this.persistentCache.entries.keys()) {
      if (pattern.test(key)) {
        this.persistentCache.entries.delete(key);
      }
    }

    try {
      await AsyncStorage.multiRemove(keysToDelete.map((k) => `cache_${k}`));
    } catch (error) {
      console.error('Failed to clear cache by pattern:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalEntries = this.memoryCache.entries.size + this.persistentCache.entries.size;
    const totalSize = Array.from(this.memoryCache.entries.values()).reduce(
      (sum, e) => sum + e.size,
      0
    );
    const total = this.hits + this.misses;

    return {
      totalEntries,
      totalSize,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      missRate: total > 0 ? (this.misses / total) * 100 : 0,
      averageHits:
        totalEntries > 0
          ? Array.from(this.memoryCache.entries.values()).reduce((sum, e) => sum + e.hits, 0) /
            totalEntries
          : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Warm up cache with critical data
   */
  async warmUp<T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    ttlMs?: number
  ): Promise<void> {
    const promises = keys.map((key) =>
      this.getOrSet(key, () => fetcher(key), ttlMs)
    );
    await Promise.all(promises);
  }

  // Private methods

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private estimateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1024; // Default to 1KB if estimation fails
    }
  }

  private canFitInCache(layer: CacheLayer, size: number): boolean {
    const currentSize = Array.from(layer.entries.values()).reduce((sum, e) => sum + e.size, 0);
    return currentSize + size < layer.maxSize && layer.entries.size < layer.maxEntries;
  }

  private evictLRU(layer: CacheLayer): void {
    // Find least recently used entry (lowest hits + oldest timestamp)
    let lruKey: string | null = null;
    let lruScore = Infinity;

    for (const [key, entry] of layer.entries) {
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000;
      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      layer.entries.delete(lruKey);
    }
  }
}

export const cacheService = CacheService.getInstance();
