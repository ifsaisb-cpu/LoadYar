import { useCRDTStore } from '../store/crdtStore';
import { useTripsStore } from '../store/tripsStore';
import { useExpensesStore } from '../store/expensesStore';
import { usePaymentsStore } from '../store/paymentsStore';
import type { CRDTRecord } from '../store/crdtStore';

interface SyncResult {
  synced: number;
  conflicts: number;
  resolved: number;
  errors: string[];
  duration: number;
}

interface SyncOptions {
  autoResolveConflicts: boolean;
  includeRecords: ('trip' | 'delivery' | 'expense' | 'gps' | 'payment')[];
}

class SyncService {
  private static instance: SyncService;
  private isSyncing = false;
  private lastSyncTime = 0;
  private syncInterval = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async startSync(options: Partial<SyncOptions> = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    if (this.isSyncing) {
      return {
        synced: 0,
        conflicts: 0,
        resolved: 0,
        errors: ['Sync already in progress'],
        duration: 0,
      };
    }

    // Check network connectivity before attempting sync
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      return {
        synced: 0,
        conflicts: 0,
        resolved: 0,
        errors: ['No network connection - sync deferred'],
        duration: 0,
      };
    }

    this.isSyncing = true;

    try {
      const crdtStore = useCRDTStore.getState();
      const tripsStore = useTripsStore.getState();
      const expensesStore = useExpensesStore.getState();
      const paymentsStore = usePaymentsStore.getState();

      // Default options
      const autoResolve = options.autoResolveConflicts ?? true;
      const includeRecords = options.includeRecords ?? ['trip', 'delivery', 'expense', 'gps', 'payment'];

      // 1. Collect local records to sync
      const recordsToSync = crdtStore.syncQueue;
      let synced = 0;

      // 2. Send local changes to backend (with retry logic)
      console.log(`[SYNC] Starting sync of ${recordsToSync.length} records`);
      for (const record of recordsToSync) {
        if (!includeRecords.includes(record.type)) continue;

        try {
          await this.syncRecordToBackend(record, 3); // Retry up to 3 times
          synced++;
          console.log(`[SYNC] ✓ Synced ${record.type}:${record.id}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to sync ${record.type} ${record.id}: ${errorMsg}`);
          console.error(`[SYNC] ✗ Failed ${record.type}:${record.id} - ${errorMsg}`);
        }
      }

      // 3. Fetch remote records from backend
      console.log(`[SYNC] Fetching ${includeRecords.length} record types from backend`);
      const remoteRecords = await this.fetchRemoteRecords(includeRecords);
      console.log(`[SYNC] Received ${remoteRecords.length} remote records`);

      // 4. Detect conflicts
      try {
        crdtStore.syncWithBackend(remoteRecords);
        const unresolvedConflicts = crdtStore.getUnresolvedConflicts();
        const conflictCount = unresolvedConflicts.length;
        console.log(`[SYNC] Detected ${conflictCount} conflicts`);

        // 5. Auto-resolve if enabled
        let resolvedCount = 0;
        if (autoResolve && conflictCount > 0) {
          const resolved = crdtStore.autoResolveConflicts();
          resolvedCount = resolved.length;
          console.log(`[SYNC] Auto-resolved ${resolvedCount} conflicts`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Conflict resolution failed: ${errorMsg}`);
        console.error(`[SYNC] Conflict resolution error: ${errorMsg}`);
      }

      // 6. Update local stores with synced data
      try {
        await this.updateLocalStores();
        console.log(`[SYNC] Updated local stores`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to update local stores: ${errorMsg}`);
        console.error(`[SYNC] Store update error: ${errorMsg}`);
      }

      // 7. Clear sync queue
      useCRDTStore.setState({ syncQueue: [] });

      this.lastSyncTime = Date.now();
      console.log(`[SYNC] Sync completed: ${synced} synced, ${errors.length} errors`);

      return {
        synced,
        conflicts: conflictCount,
        resolved: resolvedCount,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      errors.push(errorMsg);

      return {
        synced: 0,
        conflicts: 0,
        resolved: 0,
        errors,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncRecordToBackend(record: CRDTRecord, maxRetries: number = 3): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const token = await this.getAuthToken();
        const tenantId = await this.getTenantId();

        if (!token || !tenantId) {
          throw new Error('Authentication required - token or tenant not found');
        }

        const response = await fetch('https://api.loadyar.com/api/sync/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId.toString(),
            'X-Client-Timestamp': Date.now().toString(),
          },
          body: JSON.stringify({
            records: [record],
            vectorClock: record.vectorClock,
            timestamp: Date.now(),
          }),
          timeout: 10000,
        });

        if (!response.ok) {
          if (response.status === 409) {
            throw new Error(`Conflict detected on server for ${record.type}:${record.id}`);
          } else if (response.status === 401) {
            throw new Error('Authentication failed - token expired');
          } else if (response.status >= 500) {
            throw new Error(`Server error ${response.status} - will retry`);
          }
          throw new Error(`API error ${response.status}: ${response.statusText}`);
        }

        console.log(`[SYNC] Successfully synced ${record.type} record:`, record.id);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.warn(`[SYNC] Attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message);
          await this.sleep(delayMs);
        }
      }
    }

    throw new Error(`Sync failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  private async fetchRemoteRecords(
    types: ('trip' | 'delivery' | 'expense' | 'gps' | 'payment')[]
  ): Promise<CRDTRecord[]> {
    const token = await this.getAuthToken();
    const tenantId = await this.getTenantId();

    if (!token || !tenantId) {
      console.warn('[SYNC] Cannot fetch remote records - not authenticated');
      return [];
    }

    try {
      const typeFilter = types.join(',');
      const response = await fetch(
        `https://api.loadyar.com/api/sync/records?types=${typeFilter}&limit=1000`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId.toString(),
          },
          timeout: 15000,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch records: ${response.statusText}`);
      }

      const data = await response.json();
      const remoteRecords: CRDTRecord[] = data.records || [];
      console.log(`[SYNC] Fetched ${remoteRecords.length} remote records`);
      return remoteRecords;
    } catch (error) {
      console.error('[SYNC] Failed to fetch remote records:', error);
      return [];
    }
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://api.loadyar.com/health', {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    // Import AsyncStorage at top of file
    // import AsyncStorage from '@react-native-async-storage/async-storage';
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('[SYNC] Failed to get auth token:', error);
      return null;
    }
  }

  private async getTenantId(): Promise<number | null> {
    try {
      const tenantId = await AsyncStorage.getItem('tenantId');
      return tenantId ? parseInt(tenantId, 10) : null;
    } catch (error) {
      console.error('[SYNC] Failed to get tenant ID:', error);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async updateLocalStores(): Promise<void> {
    const crdtStore = useCRDTStore.getState();
    const tripsStore = useTripsStore.getState();
    const expensesStore = useExpensesStore.getState();
    const paymentsStore = usePaymentsStore.getState();

    // Update each store with synced CRDT records
    for (const record of crdtStore.records) {
      switch (record.type) {
        case 'trip':
          // Merge into trips store
          break;
        case 'delivery':
          // Merge into delivery store
          break;
        case 'expense':
          // Merge into expenses store
          break;
        case 'gps':
          // Merge into GPS store
          break;
        case 'payment':
          // Merge into payments store
          break;
      }
    }
  }

  async startPeriodicSync(intervalMs: number = 5000): Promise<void> {
    this.syncInterval = intervalMs;
    this.periodicSyncLoop();
  }

  private periodicSyncLoop(): void {
    setInterval(async () => {
      if (!this.isSyncing) {
        await this.startSync({ autoResolveConflicts: true });
      }
    }, this.syncInterval);
  }

  getSyncStatus(): {
    isSyncing: boolean;
    lastSyncTime: number;
    timeSinceLastSync: number;
  } {
    const now = Date.now();
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      timeSinceLastSync: now - this.lastSyncTime,
    };
  }

  getConflictStatus(): {
    unresolvedCount: number;
    resolvedCount: number;
    totalCount: number;
  } {
    const crdtStore = useCRDTStore.getState();
    const conflicts = crdtStore.conflicts;

    return {
      unresolvedCount: conflicts.filter((c) => !c.resolved).length,
      resolvedCount: conflicts.filter((c) => c.resolved).length,
      totalCount: conflicts.length,
    };
  }

  hasUnresolvedConflicts(): boolean {
    const crdtStore = useCRDTStore.getState();
    return crdtStore.getUnresolvedConflicts().length > 0;
  }

  async resolveAllConflicts(): Promise<number> {
    const crdtStore = useCRDTStore.getState();
    const resolved = crdtStore.autoResolveConflicts();
    return resolved.length;
  }

  getCurrentVectorClock() {
    const crdtStore = useCRDTStore.getState();
    const records = crdtStore.records;
    return records.length > 0 ? records[records.length - 1].vectorClock : {};
  }

  resetSync(): void {
    useCRDTStore.setState({
      records: [],
      conflicts: [],
      merged: [],
      syncQueue: [],
    });
  }
}

export const syncService = SyncService.getInstance();
export type { SyncResult, SyncOptions };
