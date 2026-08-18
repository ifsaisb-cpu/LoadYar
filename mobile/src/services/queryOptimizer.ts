import { cacheService } from './cacheService';

export interface QueryConfig {
  query: string;
  params?: Record<string, any>;
  cacheTtl?: number;
  cacheKey?: string;
  batchable?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface QueryPerformance {
  query: string;
  executionTime: number;
  cacheHit: boolean;
  rowsReturned: number;
  timestamp: number;
}

export interface QueryOptimizationStats {
  totalQueries: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  slowestQueries: QueryPerformance[];
  optimizationSuggestions: string[];
}

class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryMetrics: QueryPerformance[] = [];
  private batchQueue: QueryConfig[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private indexStats: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Execute optimized query with caching
   */
  async executeQuery<T>(config: QueryConfig): Promise<T> {
    const startTime = Date.now();
    const cacheKey = config.cacheKey || this.generateCacheKey(config.query, config.params);

    // Try cache first
    const cached = await cacheService.get<T>(cacheKey);
    if (cached) {
      this.recordMetric({
        query: config.query,
        executionTime: Date.now() - startTime,
        cacheHit: true,
        rowsReturned: Array.isArray(cached) ? cached.length : 1,
        timestamp: Date.now(),
      });
      return cached;
    }

    // Execute query
    const result = await this.executeWithTimeout<T>(config.query, config.params);

    // Cache result
    const ttl = config.cacheTtl || 5 * 60 * 1000; // 5 minutes default
    await cacheService.set(cacheKey, result, ttl);

    this.recordMetric({
      query: config.query,
      executionTime: Date.now() - startTime,
      cacheHit: false,
      rowsReturned: Array.isArray(result) ? result.length : 1,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Batch multiple queries for efficiency
   */
  async batchQueries(queries: QueryConfig[]): Promise<any[]> {
    return Promise.all(queries.map((q) => this.executeQuery(q)));
  }

  /**
   * Queue query for batch execution
   */
  queueQuery(config: QueryConfig): Promise<any> {
    return new Promise((resolve) => {
      this.batchQueue.push(config);

      // Execute batch if high priority or queue is full
      if (config.priority === 'high' || this.batchQueue.length >= 10) {
        this.flushBatchQueue().then((results) => {
          const queryIndex = this.batchQueue.indexOf(config);
          if (queryIndex !== -1) {
            resolve(results[queryIndex]);
          }
        });
      } else {
        // Schedule flush after 100ms
        if (!this.batchTimer) {
          this.batchTimer = setTimeout(() => {
            this.flushBatchQueue();
            this.batchTimer = null;
          }, 100);
        }
      }
    });
  }

  /**
   * Prefetch critical data
   */
  async prefetch(configs: QueryConfig[]): Promise<void> {
    const promises = configs.map((config) => this.executeQuery(config));
    await Promise.all(promises);
  }

  /**
   * Invalidate query cache by pattern
   */
  async invalidateQueries(pattern: RegExp): Promise<void> {
    await cacheService.clearByPattern(pattern);
    this.indexStats.delete(pattern.source);
  }

  /**
   * Get query optimization statistics
   */
  getStats(): QueryOptimizationStats {
    const cacheStats = cacheService.getStats();

    const slowestQueries = this.queryMetrics
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5);

    const optimizationSuggestions: string[] = [];

    // Analyze query patterns
    const cacheHitRate = cacheStats.hitRate;
    if (cacheHitRate < 50) {
      optimizationSuggestions.push('Consider increasing cache TTL for frequently accessed queries');
    }

    const avgExecTime = this.queryMetrics.reduce((sum, q) => sum + q.executionTime, 0) /
      this.queryMetrics.length || 0;

    if (slowestQueries[0]?.executionTime > avgExecTime * 3) {
      optimizationSuggestions.push('Optimize slow queries: ' + slowestQueries[0].query);
    }

    if (cacheStats.totalSize > 0.8 * 50 * 1024 * 1024) {
      optimizationSuggestions.push('Cache is nearly full, consider clearing old entries');
    }

    return {
      totalQueries: this.queryMetrics.length,
      cacheHitRate: cacheStats.hitRate,
      averageExecutionTime: avgExecTime,
      slowestQueries,
      optimizationSuggestions,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.queryMetrics = [];
    cacheService.resetStats();
  }

  // Private methods

  private async executeWithTimeout<T>(query: string, params?: Record<string, any>): Promise<T> {
    return new Promise((resolve) => {
      // Mock query execution with timeout
      setTimeout(() => {
        resolve({} as T);
      }, Math.random() * 100); // 0-100ms mock latency
    });
  }

  private generateCacheKey(query: string, params?: Record<string, any>): string {
    const queryHash = query.replace(/\s+/g, ' ').toLowerCase();
    const paramHash = params ? JSON.stringify(params) : '';
    return `query_${queryHash}_${paramHash}`.substring(0, 256);
  }

  private recordMetric(metric: QueryPerformance): void {
    this.queryMetrics.push(metric);

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  private async flushBatchQueue(): Promise<any[]> {
    if (this.batchQueue.length === 0) return [];

    const queries = [...this.batchQueue];
    this.batchQueue = [];

    return Promise.all(queries.map((q) => this.executeQuery(q)));
  }
}

export const queryOptimizer = QueryOptimizer.getInstance();

// Query optimization strategies

export const QueryStrategies = {
  // Aggressive caching for report queries
  reportQuery: (query: string, params?: Record<string, any>): QueryConfig => ({
    query,
    params,
    cacheTtl: 30 * 60 * 1000, // 30 minutes
    priority: 'normal',
  }),

  // Short-lived cache for real-time data
  realtimeQuery: (query: string, params?: Record<string, any>): QueryConfig => ({
    query,
    params,
    cacheTtl: 2 * 1000, // 2 seconds
    priority: 'high',
  }),

  // Long-term cache for master data
  masterDataQuery: (query: string, params?: Record<string, any>): QueryConfig => ({
    query,
    params,
    cacheTtl: 60 * 60 * 1000, // 1 hour
    priority: 'normal',
  }),

  // Batch-optimized query
  batchQuery: (query: string, params?: Record<string, any>): QueryConfig => ({
    query,
    params,
    cacheTtl: 5 * 60 * 1000,
    batchable: true,
    priority: 'normal',
  }),

  // High-priority query (don't batch, execute immediately)
  priorityQuery: (query: string, params?: Record<string, any>): QueryConfig => ({
    query,
    params,
    cacheTtl: 1 * 60 * 1000,
    priority: 'high',
  }),
};
