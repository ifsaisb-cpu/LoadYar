import * as Sentry from 'sentry-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CrashReport {
  id: string;
  timestamp: number;
  message: string;
  stack: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  breadcrumbs: Breadcrumb[];
}

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private isInitialized = false;
  private localReports: CrashReport[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private tenantId: string | null = null;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  async initialize(tenantId: string, userId: string): Promise<void> {
    if (this.isInitialized) return;

    this.tenantId = tenantId;
    this.userId = userId;

    try {
      Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN,
        enableAutoPerformanceMonitoring: true,
        maxBreadcrumbs: 100,
        beforeSend(event, hint) {
          // Filter sensitive data before sending
          if (event.request?.url?.includes('/auth')) {
            return null; // Don't report auth requests
          }
          return event;
        },
        environment: __DEV__ ? 'development' : 'production',
      });

      // Set user context
      Sentry.setUser({
        id: userId,
        username: userId,
      });

      // Set tags
      Sentry.setTag('tenant_id', tenantId);
      Sentry.setTag('app_version', '5.0.0');

      this.isInitialized = true;
      console.log('[ERROR] Crash reporting initialized');
    } catch (error) {
      console.error('[ERROR] Failed to initialize crash reporting:', error);
    }
  }

  captureException(error: Error | string, context?: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const report: CrashReport = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        message: errorObj.message,
        stack: errorObj.stack || '',
        context: context || {},
        severity: this.determineSeverity(errorObj),
        breadcrumbs: [...this.breadcrumbs],
      };

      // Store locally
      this.storeLocalReport(report);

      // Send to Sentry
      Sentry.captureException(errorObj, {
        tags: {
          service: context?.service || 'unknown',
          operation: context?.operation || 'unknown',
        },
        contexts: {
          app: context || {},
        },
        breadcrumbs: this.breadcrumbs.map((b) => ({
          timestamp: b.timestamp / 1000,
          category: b.category,
          message: b.message,
          level: b.level,
          data: b.data,
        })),
      });

      console.error(`[ERROR] Captured ${report.severity} exception:`, errorObj.message);
    } catch (error) {
      console.error('[ERROR] Failed to capture exception:', error);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isInitialized) return;

    try {
      Sentry.captureMessage(message, level);
      this.addBreadcrumb(message, 'app', level);
    } catch (error) {
      console.error('[ERROR] Failed to capture message:', error);
    }
  }

  addBreadcrumb(message: string, category: string = 'app', level: 'info' | 'warning' | 'error' = 'info'): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      level,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }

    // Also log to Sentry
    if (this.isInitialized) {
      Sentry.addBreadcrumb({
        timestamp: Date.now() / 1000,
        category,
        message,
        level,
      });
    }
  }

  setUserContext(userId: string, email?: string, username?: string): void {
    this.userId = userId;

    if (this.isInitialized) {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });
    }
  }

  setTag(key: string, value: string): void {
    if (this.isInitialized) {
      Sentry.setTag(key, value);
    }
  }

  setContext(key: string, value: Record<string, any>): void {
    if (this.isInitialized) {
      Sentry.setContext(key, value);
    }
  }

  async capturePerformance(operation: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const transaction = Sentry.startTransaction({
        op: operation,
        name: operation,
      });

      // Simulate span for duration
      const span = transaction.startChild({
        op: operation,
        description: operation,
      });

      setTimeout(() => {
        span.finish();
        transaction.finish();
      }, duration);

      this.addBreadcrumb(`${operation} completed in ${duration}ms`, 'performance', 'info');
    } catch (error) {
      console.error('[ERROR] Failed to capture performance:', error);
    }
  }

  async getLocalReports(limit: number = 50): Promise<CrashReport[]> {
    return this.localReports.slice(-limit);
  }

  async clearLocalReports(): Promise<void> {
    this.localReports = [];
    await AsyncStorage.removeItem('crashReports');
  }

  // Private methods

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) return 'critical';
    if (message.includes('error') || message.includes('failed')) return 'high';
    if (message.includes('warning')) return 'medium';
    return 'low';
  }

  private async storeLocalReport(report: CrashReport): Promise<void> {
    try {
      this.localReports.push(report);

      // Keep only last 100 reports
      if (this.localReports.length > 100) {
        this.localReports.shift();
      }

      // Persist to AsyncStorage
      await AsyncStorage.setItem('crashReports', JSON.stringify(this.localReports));
    } catch (error) {
      console.error('[ERROR] Failed to store crash report:', error);
    }
  }
}

export const errorReportingService = ErrorReportingService.getInstance();

// Global error handler
if (typeof global !== 'undefined') {
  global.ErrorUtils = global.ErrorUtils || {};
  const originalErrorHandler = global.ErrorUtils.getGlobalHandler();

  global.ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    errorReportingService.captureException(error, {
      isFatal,
      type: 'uncaught_error',
    });

    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
}
