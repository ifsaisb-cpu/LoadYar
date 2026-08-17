import * as Sentry from 'sentry-expo';
import { storageService } from './storage';

export interface ErrorContext {
  userId?: number;
  tenantId?: number;
  tripId?: number;
  screen?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  type: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  breadcrumbs: Array<{
    category: string;
    message: string;
    timestamp: string;
  }>;
}

class ErrorTrackingService {
  private breadcrumbs: Array<{ category: string; message: string; timestamp: string }> = [];
  private maxBreadcrumbs = 50;
  private context: ErrorContext = {};

  initialize(sentryDSN?: string): void {
    if (sentryDSN) {
      Sentry.init({
        dsn: sentryDSN,
        tracesSampleRate: 0.1, // 10% of transactions
        enableNative: true,
        attachStacktrace: true,
        maxBreadcrumbs: this.maxBreadcrumbs,
        beforeSend(event, hint) {
          // Filter out certain errors
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof TypeError && error.message.includes('Network')) {
              return null; // Don't send network errors
            }
          }
          return event;
        },
      });

      console.log('Error tracking initialized with Sentry');
    } else {
      console.log('Error tracking initialized (local only, no Sentry)');
    }
  }

  setContext(context: ErrorContext): void {
    this.context = context;

    if (context.userId) {
      Sentry.setUser({
        id: context.userId.toString(),
        email: `user-${context.userId}@loadyar.pk`,
      });
    }

    if (context.tenantId) {
      Sentry.setTag('tenant_id', context.tenantId.toString());
    }

    if (context.tripId) {
      Sentry.setTag('trip_id', context.tripId.toString());
    }

    if (context.metadata) {
      Sentry.setContext('custom', context.metadata);
    }
  }

  addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const breadcrumb = {
      category,
      message,
      timestamp: new Date().toISOString(),
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    Sentry.captureMessage(message, level);
  }

  captureException(error: Error | unknown, context?: Partial<ErrorContext>): string {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullContext: ErrorContext = {
      ...this.context,
      ...context,
    };

    // Log locally
    const errorReport: ErrorReport = {
      id: errorId,
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: fullContext,
      timestamp: new Date().toISOString(),
      breadcrumbs: [...this.breadcrumbs],
    };

    console.error('[Error Tracking]', errorReport);

    // Store locally
    this.storeErrorReport(errorReport).catch((err) =>
      console.error('Failed to store error report:', err),
    );

    // Send to Sentry
    if (error instanceof Error) {
      Sentry.withScope((scope) => {
        if (fullContext.screen) {
          scope.setTag('screen', fullContext.screen);
        }
        if (fullContext.action) {
          scope.setTag('action', fullContext.action);
        }
        if (fullContext.metadata) {
          scope.setContext('metadata', fullContext.metadata);
        }

        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(new Error(String(error)));
    }

    return errorId;
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.addBreadcrumb('message', message, level);
  }

  private async storeErrorReport(report: ErrorReport): Promise<void> {
    try {
      const reports = (await storageService.getItem('error_reports')) || [];
      reports.push(report);

      // Keep only last 50 reports
      const trimmed = reports.slice(-50);
      await storageService.setItem('error_reports', trimmed);
    } catch (error) {
      console.error('Failed to store error report:', error);
    }
  }

  async getStoredErrors(): Promise<ErrorReport[]> {
    try {
      const reports = await storageService.getItem('error_reports');
      return reports || [];
    } catch (error) {
      console.error('Failed to get stored errors:', error);
      return [];
    }
  }

  async clearStoredErrors(): Promise<void> {
    try {
      await storageService.removeItem('error_reports');
    } catch (error) {
      console.error('Failed to clear stored errors:', error);
    }
  }

  async uploadErrorsToBackend(apiClient: any): Promise<{ success: number; failed: number }> {
    try {
      const errors = await this.getStoredErrors();

      if (errors.length === 0) {
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      for (const error of errors) {
        try {
          await apiClient.post('/errors/report', {
            error_id: error.id,
            type: error.type,
            message: error.message,
            stack: error.stack,
            context: error.context,
            timestamp: error.timestamp,
            breadcrumb_count: error.breadcrumbs.length,
          });

          success++;
        } catch (uploadError) {
          failed++;
          console.error('Failed to upload error:', uploadError);
        }
      }

      // Clear successfully uploaded errors
      if (success > 0) {
        await this.clearStoredErrors();
      }

      return { success, failed };
    } catch (error) {
      console.error('Upload errors to backend error:', error);
      return { success: 0, failed: 0 };
    }
  }

  getBreadcrumbs(): Array<{ category: string; message: string; timestamp: string }> {
    return [...this.breadcrumbs];
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

export const errorTrackingService = new ErrorTrackingService();
