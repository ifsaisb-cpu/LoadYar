import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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
   * Get from cache (memory first, then persistent, then async storage)
   * No promotion to prevent memory duplication
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache only
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

    // Check persistent cache only (don't promote)
    const persEntry = this.persistentCache.entries.get(key);
    if (persEntry) {
      if (this.isExpired(persEntry)) {
        this.persistentCache.entries.delete(key);
        await AsyncStorage.removeItem(`cache_${key}`);
      } else {
        persEntry.hits++;
        this.hits++;
        return persEntry.value as T;
      }
    }

    // Try AsyncStorage directly (fallback only, no promotion)
    try {
      const isSensitive = this.isSensitiveKey(key);
      let stored: string | null = null;

      if (isSensitive) {
        try {
          stored = await SecureStore.getItemAsync(`cache_${key}`);
        } catch (error) {
          console.warn(`SecureStore unavailable, falling back to AsyncStorage for ${key}`);
          stored = await AsyncStorage.getItem(`cache_${key}`);
        }
      } else {
        stored = await AsyncStorage.getItem(`cache_${key}`);
      }

      if (stored) {
        const entry = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          entry.hits++;
          this.hits++;
          return entry.value as T;
        } else {
          await this.deleteFromStorage(key, isSensitive);
        }
      }
    } catch (error) {
      console.error(`Failed to get cache for ${key}:`, error);
    }

    this.misses++;
    return null;
  }

  /**
   * Set cache entry (store in layers with proper eviction)
   */
  async set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    const size = this.estimateSize(value);

    // Reject oversized entries to prevent cache bloat
    if (size > this.memoryCache.maxSize / 2) {
      console.warn(`Entry ${key} (${size} bytes) exceeds cache capacity, skipping`);
      return;
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0,
      size,
    };

    // Store in memory cache with eviction loop
    while (!this.canFitInCache(this.memoryCache, size)) {
      this.evictLRU(this.memoryCache);
    }
    this.memoryCache.entries.set(key, entry);

    // Store in persistent cache with eviction loop
    while (!this.canFitInCache(this.persistentCache, size)) {
      this.evictLRU(this.persistentCache);
    }
    this.persistentCache.entries.set(key, entry);

    // Persist to storage (encryption for sensitive data)
    try {
      const isSensitive = this.isSensitiveKey(key);
      const storedEntry = { ...entry, encrypted: isSensitive };
      const entryJson = JSON.stringify(storedEntry);

      if (isSensitive) {
        try {
          await SecureStore.setItemAsync(`cache_${key}`, entryJson);
        } catch (error) {
          console.warn(`SecureStore unavailable, falling back to AsyncStorage for ${key}`);
          await AsyncStorage.setItem(`cache_${key}`, entryJson);
        }
      } else {
        await AsyncStorage.setItem(`cache_${key}`, entryJson);
      }
    } catch (error) {
      console.error(`Failed to persist cache for ${key}:`, error);
    }
  }

  private async deleteFromStorage(key: string, isSensitive: boolean): Promise<void> {
    try {
      if (isSensitive) {
        try {
          await SecureStore.deleteItemAsync(`cache_${key}`);
        } catch (error) {
          await AsyncStorage.removeItem(`cache_${key}`);
        }
      } else {
        await AsyncStorage.removeItem(`cache_${key}`);
      }
    } catch (error) {
      console.error(`Failed to delete cache for ${key}:`, error);
    }
  }

  private isSensitiveKey(key: string): boolean {
    return key.includes('payment') ||
           key.includes('transaction') ||
           key.includes('token') ||
           key.includes('auth') ||
           key.includes('card') ||
           key.includes('password') ||
           key.includes('credential');
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
    // Find least recently used entry based on hit-weighted age
    // Entries with few hits and old age are evicted first
    let lruKey: string | null = null;
    let lruScore = Infinity;
    const now = Date.now();

    for (const [key, entry] of layer.entries) {
      // Age in seconds
      const ageSeconds = (now - entry.timestamp) / 1000;
      // Score: prioritize old entries with few hits
      // Higher age = higher score (more likely to evict)
      // Lower hits = higher score (less valuable)
      const score = ageSeconds / Math.max(1, entry.hits);

      if (score > lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      const evictedEntry = layer.entries.get(lruKey);
      if (evictedEntry) {
        layer.entries.delete(lruKey);
        console.debug(`[CACHE] Evicted ${lruKey} (age: ${Math.round((now - evictedEntry.timestamp) / 1000)}s, hits: ${evictedEntry.hits})`);
      }
    } else if (layer.entries.size > 0) {
      // Fallback: evict oldest entry if no LRU key found
      const firstEntry = layer.entries.entries().next();
      if (!firstEntry.done) {
        const [key] = firstEntry.value;
        layer.entries.delete(key);
        console.debug(`[CACHE] Evicted oldest entry ${key}`);
      }
    }
  }
}

export const cacheService = CacheService.getInstance();
