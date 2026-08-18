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

      // 2. Send local changes to backend
      for (const record of recordsToSync) {
        if (!includeRecords.includes(record.type)) continue;

        try {
          // Mock backend sync - replace with real API call
          await this.syncRecordToBackend(record);
          synced++;
        } catch (error) {
          errors.push(`Failed to sync ${record.type} ${record.id}: ${error}`);
        }
      }

      // 3. Fetch remote records from backend
      const remoteRecords = await this.fetchRemoteRecords(includeRecords);

      // 4. Detect conflicts
      crdtStore.syncWithBackend(remoteRecords);
      const unresolvedConflicts = crdtStore.getUnresolvedConflicts();
      const conflictCount = unresolvedConflicts.length;

      // 5. Auto-resolve if enabled
      let resolvedCount = 0;
      if (autoResolve && conflictCount > 0) {
        const resolved = crdtStore.autoResolveConflicts();
        resolvedCount = resolved.length;
      }

      // 6. Update local stores with synced data
      await this.updateLocalStores();

      // 7. Clear sync queue
      useCRDTStore.setState({ syncQueue: [] });

      this.lastSyncTime = Date.now();

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

  private async syncRecordToBackend(record: CRDTRecord): Promise<void> {
    // Mock backend API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[SYNC] Synced ${record.type} record:`, record.id);
        resolve();
      }, 500);
    });
  }

  private async fetchRemoteRecords(
    types: ('trip' | 'delivery' | 'expense' | 'gps' | 'payment')[]
  ): Promise<CRDTRecord[]> {
    // Mock fetching remote records from backend
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate fetching remote records
        const remoteRecords: CRDTRecord[] = [];
        console.log(`[SYNC] Fetched ${remoteRecords.length} remote records`);
        resolve(remoteRecords);
      }, 1000);
    });
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
