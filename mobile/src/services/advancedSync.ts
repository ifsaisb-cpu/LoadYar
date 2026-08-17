import { storageService } from './storage';
import { apiClient } from './api';

export type SyncConflictStrategy = 'local' | 'remote' | 'merge' | 'ask';

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  localTimestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
}

export interface SyncConflict {
  operationId: string;
  endpoint: string;
  local: any;
  remote: any;
  resolution?: 'local' | 'remote' | 'merged';
}

export interface SyncStats {
  totalOperations: number;
  synced: number;
  pending: number;
  failed: number;
  conflicts: number;
  lastSyncTime?: number;
  averageSyncTime: number;
}

class AdvancedSyncService {
  private syncInProgress = false;
  private conflicts: SyncConflict[] = [];
  private syncHistory: { timestamp: number; duration: number; success: boolean }[] = [];

  /**
   * Full sync with conflict detection and resolution
   */
  async performSync(
    conflictStrategy: SyncConflictStrategy = 'ask',
    progressCallback?: (progress: number) => void,
  ): Promise<SyncStats> {
    if (this.syncInProgress) {
      console.warn('Sync already in progress');
      return this.getSyncStats();
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      const queue = await storageService.getSyncQueue();
      const totalOperations = queue.length;

      if (totalOperations === 0) {
        return this.getSyncStats();
      }

      let synced = 0;
      let failed = 0;

      for (let i = 0; i < queue.length; i++) {
        const operation = queue[i];

        try {
          const result = await this.syncOperation(operation, conflictStrategy);

          if (result.success) {
            synced++;
            await storageService.removeSyncQueueItem(operation.id);
          } else if (result.conflict) {
            this.conflicts.push(result.conflict);
          } else {
            failed++;
            operation.retries = (operation.retries || 0) + 1;

            if (operation.retries > 3) {
              await storageService.removeSyncQueueItem(operation.id);
            }
          }
        } catch (error) {
          failed++;
          console.error(`Failed to sync operation ${operation.id}:`, error);
        }

        // Report progress
        if (progressCallback) {
          progressCallback(((synced + failed) / totalOperations) * 100);
        }
      }

      const duration = Date.now() - startTime;
      this.syncHistory.push({ timestamp: Date.now(), duration, success: failed === 0 });

      // Keep only last 100 sync history entries
      if (this.syncHistory.length > 100) {
        this.syncHistory = this.syncHistory.slice(-100);
      }

      return this.getSyncStats();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync single operation with conflict detection
   */
  private async syncOperation(
    operation: SyncOperation,
    conflictStrategy: SyncConflictStrategy,
  ): Promise<{ success: boolean; conflict?: SyncConflict }> {
    try {
      let response;

      switch (operation.type) {
        case 'CREATE':
          response = await apiClient.post(operation.endpoint, operation.data);
          break;

        case 'UPDATE':
          response = await apiClient.patch(operation.endpoint, operation.data);
          break;

        case 'DELETE':
          response = await apiClient.delete(operation.endpoint);
          break;
      }

      return { success: true };
    } catch (error: any) {
      // Check if conflict (409 Conflict)
      if (error.response?.status === 409) {
        const remote = error.response.data;
        const conflict: SyncConflict = {
          operationId: operation.id,
          endpoint: operation.endpoint,
          local: operation.data,
          remote,
        };

        // Auto-resolve based on strategy
        if (conflictStrategy === 'local') {
          conflict.resolution = 'local';
          // Retry with local data
          return this.syncOperation(operation, 'local');
        } else if (conflictStrategy === 'remote') {
          conflict.resolution = 'remote';
          // Discard local changes
          return { success: true, conflict };
        } else if (conflictStrategy === 'merge') {
          conflict.resolution = 'merged';
          const merged = this.mergeData(operation.data, remote);
          operation.data = merged;
          return this.syncOperation(operation, 'merge');
        } else {
          // Ask user (conflict stored for UI prompt)
          return { success: false, conflict };
        }
      }

      // Retry-able error (network, timeout)
      if (this.isRetryableError(error)) {
        return { success: false };
      }

      // Non-retryable error
      throw error;
    }
  }

  /**
   * Merge conflicting data (simple strategy: prefer non-null remote values)
   */
  private mergeData(local: any, remote: any): any {
    if (!local || !remote) {
      return remote || local;
    }

    const merged = { ...local };

    for (const key in remote) {
      // Prefer remote for most fields, but keep local timestamps
      if (key.includes('timestamp') && local[key]) {
        continue;
      }

      merged[key] = remote[key] ?? local[key];
    }

    return merged;
  }

  /**
   * Resolve a conflict with user choice
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
  ): Promise<boolean> {
    try {
      const conflict = this.conflicts.find((c) => c.operationId === conflictId);

      if (!conflict) {
        return false;
      }

      conflict.resolution = resolution;

      // Re-sync with resolved conflict
      const queue = await storageService.getSyncQueue();
      const operation = queue.find((op) => op.id === conflictId);

      if (!operation) {
        return false;
      }

      if (resolution === 'remote') {
        // Discard local changes
        await storageService.removeSyncQueueItem(operation.id);
      } else if (resolution === 'local') {
        // Retry with local data
        const result = await this.syncOperation(operation, 'local');
        if (result.success) {
          await storageService.removeSyncQueueItem(operation.id);
        }
      } else if (resolution === 'merged') {
        // Use merged data
        const merged = this.mergeData(operation.data, conflict.remote);
        operation.data = merged;
        const result = await this.syncOperation(operation, 'merge');
        if (result.success) {
          await storageService.removeSyncQueueItem(operation.id);
        }
      }

      // Remove from conflicts list
      this.conflicts = this.conflicts.filter((c) => c.operationId !== conflictId);

      return true;
    } catch (error) {
      console.error('Resolve conflict error:', error);
      return false;
    }
  }

  /**
   * Get current sync status and statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    const queue = await storageService.getSyncQueue();

    const stats: SyncStats = {
      totalOperations: queue.length,
      synced: queue.filter((op) => op.status === 'synced').length,
      pending: queue.filter((op) => op.status === 'pending').length,
      failed: queue.filter((op) => op.status === 'failed').length,
      conflicts: this.conflicts.length,
      averageSyncTime: this.calculateAverageSyncTime(),
    };

    if (this.syncHistory.length > 0) {
      stats.lastSyncTime = this.syncHistory[this.syncHistory.length - 1].timestamp;
    }

    return stats;
  }

  /**
   * Get pending conflicts
   */
  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  /**
   * Clear all conflicts and operation history
   */
  async clearHistory(): Promise<void> {
    this.conflicts = [];
    this.syncHistory = [];
    await storageService.clearSyncQueue();
  }

  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network error
      return true;
    }

    const status = error.response.status;

    // Retry on server errors and timeout
    return status === 408 || status === 429 || status >= 500;
  }

  private calculateAverageSyncTime(): number {
    if (this.syncHistory.length === 0) {
      return 0;
    }

    const total = this.syncHistory.reduce((sum, entry) => sum + entry.duration, 0);
    return Math.round(total / this.syncHistory.length);
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const advancedSyncService = new AdvancedSyncService();
