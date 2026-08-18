import { cacheService } from './cacheService';

export interface NetworkMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  cachedRequests: number;
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
  signalStrength: number; // 0-4 bars
}

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
  cacheTtl?: number;
  priority?: 'high' | 'normal' | 'low';
  compress?: boolean;
  timeout?: number;
}

interface RequestMetric {
  url: string;
  method: string;
  responseTime: number;
  dataSize: number;
  cached: boolean;
  timestamp: number;
  success: boolean;
}

class NetworkOptimizer {
  private static instance: NetworkOptimizer;
  private metrics: RequestMetric[] = [];
  private requestQueue: RequestConfig[] = [];
  private isProcessing = false;
  private connectionType: 'wifi' | '4g' | '3g' | '2g' | 'unknown' = 'unknown';
  private signalStrength: number = 3;

  private constructor() {
    this.initializeConnectionMonitoring();
  }

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer();
    }
    return NetworkOptimizer.instance;
  }

  /**
   * Make optimized HTTP request with caching
   */
  async makeRequest<T>(config: RequestConfig): Promise<T> {
    const startTime = Date.now();
    const cacheKey = `${config.method}_${config.url}_${JSON.stringify(config.data || {})}`;

    // For GET requests, try cache first
    if (config.method === 'GET') {
      const cached = await cacheService.get<T>(cacheKey);
      if (cached) {
        this.recordMetric({
          url: config.url,
          method: config.method,
          responseTime: Date.now() - startTime,
          dataSize: 0,
          cached: true,
          timestamp: Date.now(),
          success: true,
        });
        return cached;
      }
    }

    // Make actual request
    const response = await this.executeRequest<T>(config);
    const responseTime = Date.now() - startTime;

    // Cache GET responses
    if (config.method === 'GET' && response) {
      const ttl = config.cacheTtl || this.getDefaultCacheTtl();
      await cacheService.set(cacheKey, response, ttl);
    }

    this.recordMetric({
      url: config.url,
      method: config.method,
      responseTime,
      dataSize: JSON.stringify(response).length,
      cached: false,
      timestamp: Date.now(),
      success: true,
    });

    return response;
  }

  /**
   * Queue request for batch processing
   */
  queueRequest<T>(config: RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(config);

      // Process immediately for high-priority requests
      if (config.priority === 'high' || this.requestQueue.length >= 5) {
        this.processBatch()
          .then((results) => {
            const index = this.requestQueue.indexOf(config);
            if (index !== -1) {
              resolve(results[index] as T);
            }
          })
          .catch(reject);
      } else {
        // Schedule batch processing
        setTimeout(() => this.processBatch(), 500);
      }
    });
  }

  /**
   * Batch multiple requests
   */
  async batchRequests<T>(configs: RequestConfig[]): Promise<T[]> {
    return Promise.all(configs.map((config) => this.makeRequest<T>(config)));
  }

  /**
   * Prefetch resources before they're needed
   */
  async prefetch(urls: string[]): Promise<void> {
    const configs = urls.map((url) => ({
      url,
      method: 'GET' as const,
      cacheTtl: 60 * 60 * 1000, // 1 hour
      priority: 'low' as const,
    }));

    await Promise.all(configs.map((config) => this.makeRequest(config)));
  }

  /**
   * Compress data for transmission
   */
  compressData(data: Record<string, any>): string {
    // Mock compression - remove null values and empty strings
    const compressed: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        compressed[key] = value;
      }
    }

    return JSON.stringify(compressed);
  }

  /**
   * Decompress received data
   */
  decompressData(data: string): Record<string, any> {
    return JSON.parse(data);
  }

  /**
   * Get network metrics
   */
  getMetrics(): NetworkMetrics {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const cachedRequests = this.metrics.filter((m) => m.cached).length;
    const averageResponseTime =
      totalRequests > 0
        ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
        : 0;
    const totalDataTransferred = this.metrics.reduce((sum, m) => sum + m.dataSize, 0);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      totalDataTransferred,
      cachedRequests,
      connectionType: this.connectionType,
      signalStrength: this.signalStrength,
    };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const metrics = this.getMetrics();
    const suggestions: string[] = [];

    if (metrics.averageResponseTime > 500) {
      suggestions.push('Response times are slow. Consider prefetching critical data.');
    }

    if (metrics.cachedRequests < metrics.totalRequests * 0.3) {
      suggestions.push('Cache hit rate is low. Increase cache TTL for frequently accessed endpoints.');
    }

    if (metrics.totalDataTransferred > 100 * 1024 * 1024) {
      suggestions.push('High data transfer. Enable compression for large responses.');
    }

    if (this.connectionType === '2g' || this.connectionType === '3g') {
      suggestions.push('Poor connection detected. Reduce image quality and prefetch data.');
    }

    return suggestions;
  }

  /**
   * Clear all metrics
   */
  resetMetrics(): void {
    this.metrics = [];
  }

  // Private methods

  private async executeRequest<T>(config: RequestConfig): Promise<T> {
    // Mock API call with simulated network conditions
    return new Promise((resolve) => {
      const delay = this.getSimulatedDelay();
      setTimeout(() => {
        resolve({} as T);
      }, delay);
    });
  }

  private getSimulatedDelay(): number {
    // Simulate different network speeds
    const baseDelay = 200;
    const networkMultiplier = {
      'wifi': 0.5,
      '4g': 1.0,
      '3g': 2.0,
      '2g': 4.0,
      'unknown': 1.5,
    };

    const multiplier = networkMultiplier[this.connectionType];
    return baseDelay * multiplier + Math.random() * 100;
  }

  private getDefaultCacheTtl(): number {
    // Vary cache TTL based on connection quality
    if (this.connectionType === 'wifi') {
      return 10 * 60 * 1000; // 10 min
    } else if (this.connectionType === '4g') {
      return 15 * 60 * 1000; // 15 min
    } else {
      return 30 * 60 * 1000; // 30 min (be aggressive on slow connections)
    }
  }

  private recordMetric(metric: RequestMetric): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private async processBatch(): Promise<any[]> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return [];
    }

    this.isProcessing = true;
    const batch = [...this.requestQueue];
    this.requestQueue = [];

    try {
      const results = await Promise.all(batch.map((config) => this.makeRequest(config)));
      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  private initializeConnectionMonitoring(): void {
    // Mock connection monitoring
    // In real app, would use react-native-netinfo
    setInterval(() => {
      const types: Array<'wifi' | '4g' | '3g' | '2g' | 'unknown'> = ['wifi', '4g', '3g', '2g'];
      this.connectionType = types[Math.floor(Math.random() * types.length)];
      this.signalStrength = Math.floor(Math.random() * 5);
    }, 30000);
  }
}

export const networkOptimizer = NetworkOptimizer.getInstance();

// Network optimization presets

export const NetworkStrategies = {
  // Critical data - fetch immediately with retry
  critical: (url: string): RequestConfig => ({
    url,
    method: 'GET',
    priority: 'high',
    cacheTtl: 5 * 60 * 1000, // 5 min
    timeout: 5000,
  }),

  // Normal requests - batch when possible
  normal: (url: string): RequestConfig => ({
    url,
    method: 'GET',
    priority: 'normal',
    cacheTtl: 15 * 60 * 1000, // 15 min
    timeout: 10000,
  }),

  // Background data - aggressive caching
  background: (url: string): RequestConfig => ({
    url,
    method: 'GET',
    priority: 'low',
    cacheTtl: 60 * 60 * 1000, // 1 hour
    timeout: 30000,
  }),

  // Images - heavy compression
  image: (url: string): RequestConfig => ({
    url,
    method: 'GET',
    priority: 'low',
    cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
    compress: true,
  }),

  // API mutations - no cache
  mutation: (url: string, method: 'POST' | 'PUT' | 'DELETE', data: Record<string, any>): RequestConfig => ({
    url,
    method,
    data,
    priority: 'high',
    compress: true,
    timeout: 10000,
  }),
};
