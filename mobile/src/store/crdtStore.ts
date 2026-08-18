import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VectorClock {
  [replicaId: string]: number;
}

export interface CRDTRecord {
  id: string;
  type: 'trip' | 'delivery' | 'expense' | 'gps' | 'payment';
  data: Record<string, any>;
  vectorClock: VectorClock;
  timestamp: number;
  replicaId: string;
  operation: 'create' | 'update' | 'delete';
}

export interface ConflictRecord {
  id: string;
  recordId: string;
  recordType: 'trip' | 'delivery' | 'expense' | 'gps' | 'payment';
  localVersion: CRDTRecord;
  remoteVersion: CRDTRecord;
  conflictType: 'concurrent_update' | 'update_vs_delete' | 'concurrent_delete';
  createdAt: number;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merged';
}

export interface MergedRecord {
  id: string;
  recordId: string;
  type: 'trip' | 'delivery' | 'expense' | 'gps' | 'payment';
  mergedData: Record<string, any>;
  strategy: 'lww' | 'vector_clock' | 'manual' | 'auto_merge';
  vectorClock: VectorClock;
  timestamp: number;
}

interface CRDTStore {
  records: CRDTRecord[];
  conflicts: ConflictRecord[];
  merged: MergedRecord[];
  replicaId: string;
  syncQueue: CRDTRecord[];

  initializeReplica: (id: string) => void;
  incrementVectorClock: () => VectorClock;
  addRecord: (record: Omit<CRDTRecord, 'vectorClock' | 'timestamp' | 'replicaId'>) => void;
  updateRecord: (id: string, data: Record<string, any>) => void;
  deleteRecord: (id: string) => void;
  detectConflict: (local: CRDTRecord, remote: CRDTRecord) => ConflictRecord | null;
  compareVectorClocks: (vc1: VectorClock, vc2: VectorClock) => 'before' | 'after' | 'concurrent';
  mergeRecords: (conflict: ConflictRecord, strategy: 'local' | 'remote' | 'merged') => MergedRecord;
  autoResolveConflicts: () => ConflictRecord[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: Record<string, any>) => void;
  getUnresolvedConflicts: () => ConflictRecord[];
  syncWithBackend: (remoteRecords: CRDTRecord[]) => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useCRDTStore = create<CRDTStore>((set, get) => ({
  records: [],
  conflicts: [],
  merged: [],
  replicaId: '',
  syncQueue: [],

  initializeReplica: (id: string) => {
    set({ replicaId: id });
  },

  incrementVectorClock: () => {
    const { replicaId } = get();
    const records = get().records;
    const lastClock = records.length > 0 ? records[records.length - 1].vectorClock : {};

    const newClock = { ...lastClock };
    newClock[replicaId] = (newClock[replicaId] || 0) + 1;
    return newClock;
  },

  addRecord: (record) => {
    const vectorClock = get().incrementVectorClock();
    const newRecord: CRDTRecord = {
      ...record,
      vectorClock,
      timestamp: Date.now(),
      replicaId: get().replicaId,
    };

    const records = get().records;
    set({ records: [...records, newRecord] });
    get().syncQueue.push(newRecord);
    get().saveToStorage();
  },

  updateRecord: (id: string, data: Record<string, any>) => {
    const records = get().records;
    const existing = records.find((r) => r.id === id);

    if (!existing) return;

    const vectorClock = get().incrementVectorClock();
    const updated: CRDTRecord = {
      ...existing,
      data: { ...existing.data, ...data },
      vectorClock,
      timestamp: Date.now(),
      operation: 'update',
    };

    const updatedRecords = records.map((r) => (r.id === id ? updated : r));
    set({ records: updatedRecords });
    get().syncQueue.push(updated);
    get().saveToStorage();
  },

  deleteRecord: (id: string) => {
    const records = get().records;
    const existing = records.find((r) => r.id === id);

    if (!existing) return;

    const vectorClock = get().incrementVectorClock();
    const deleted: CRDTRecord = {
      ...existing,
      operation: 'delete',
      vectorClock,
      timestamp: Date.now(),
    };

    const updatedRecords = records.map((r) => (r.id === id ? deleted : r));
    set({ records: updatedRecords });
    get().syncQueue.push(deleted);
    get().saveToStorage();
  },

  compareVectorClocks: (vc1: VectorClock, vc2: VectorClock) => {
    const keys = new Set([...Object.keys(vc1), ...Object.keys(vc2)]);

    let before = true;
    let after = true;

    for (const key of keys) {
      const v1 = vc1[key] || 0;
      const v2 = vc2[key] || 0;

      if (v1 > v2) after = false;
      if (v1 < v2) before = false;
    }

    if (before && !after) return 'before';
    if (after && !before) return 'after';
    return 'concurrent';
  },

  detectConflict: (local: CRDTRecord, remote: CRDTRecord) => {
    if (local.id !== remote.id || local.type !== remote.type) return null;

    const comparison = get().compareVectorClocks(local.vectorClock, remote.vectorClock);

    if (comparison === 'concurrent') {
      const conflictType =
        local.operation === 'delete' && remote.operation === 'delete'
          ? 'concurrent_delete'
          : local.operation === 'delete' || remote.operation === 'delete'
            ? 'update_vs_delete'
            : 'concurrent_update';

      const conflict: ConflictRecord = {
        id: `${local.id}_${Date.now()}`,
        recordId: local.id,
        recordType: local.type,
        localVersion: local,
        remoteVersion: remote,
        conflictType,
        createdAt: Date.now(),
        resolved: false,
      };

      const conflicts = get().conflicts;
      set({ conflicts: [...conflicts, conflict] });
      return conflict;
    }

    if (comparison === 'before') {
      // Local is older, remote is newer
      const updated: CRDTRecord = {
        ...remote,
        replicaId: get().replicaId,
      };
      const records = get().records.map((r) => (r.id === local.id ? updated : r));
      set({ records });
      return null;
    }

    // Local is newer, keep local
    return null;
  },

  mergeRecords: (conflict: ConflictRecord, strategy: 'local' | 'remote' | 'merged') => {
    let mergedData: Record<string, any>;
    const vectorClock = get().incrementVectorClock();

    if (strategy === 'local') {
      mergedData = conflict.localVersion.data;
    } else if (strategy === 'remote') {
      mergedData = conflict.remoteVersion.data;
    } else {
      // Auto-merge: combine non-conflicting fields
      const local = conflict.localVersion.data;
      const remote = conflict.remoteVersion.data;

      mergedData = { ...local };
      for (const key in remote) {
        if (!(key in local) || JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
          // Use remote for conflicting/missing fields (can be customized per field)
          if (typeof remote[key] === 'object' && typeof local[key] === 'object') {
            mergedData[key] = { ...local[key], ...remote[key] };
          } else {
            // Last-write-wins for scalar fields
            const localTime = conflict.localVersion.timestamp;
            const remoteTime = conflict.remoteVersion.timestamp;
            mergedData[key] = remoteTime > localTime ? remote[key] : local[key];
          }
        }
      }
    }

    const merged: MergedRecord = {
      id: `${Date.now()}_${Math.random()}`,
      recordId: conflict.recordId,
      type: conflict.recordType,
      mergedData,
      strategy: strategy === 'merged' ? 'auto_merge' : strategy === 'local' ? 'lww' : 'lww',
      vectorClock,
      timestamp: Date.now(),
    };

    const mergedRecords = get().merged;
    set({ merged: [...mergedRecords, merged] });

    // Mark conflict as resolved
    const conflicts = get().conflicts.map((c) =>
      c.id === conflict.id
        ? { ...c, resolved: true, resolution: strategy }
        : c
    );
    set({ conflicts });

    // Update the main record with merged data
    const records = get().records.map((r) =>
      r.id === conflict.recordId
        ? {
            ...r,
            data: mergedData,
            vectorClock,
            timestamp: Date.now(),
            operation: 'update' as const,
          }
        : r
    );
    set({ records });

    get().saveToStorage();
    return merged;
  },

  autoResolveConflicts: () => {
    const conflicts = get().getUnresolvedConflicts();
    const resolved: ConflictRecord[] = [];

    for (const conflict of conflicts) {
      if (conflict.conflictType === 'concurrent_delete') {
        // Both deleted = no conflict, just mark resolved
        get().mergeRecords(conflict, 'local');
        resolved.push(conflict);
      } else if (conflict.conflictType === 'update_vs_delete') {
        // Keep the updated version
        const deleted =
          conflict.localVersion.operation === 'delete'
            ? conflict.localVersion
            : conflict.remoteVersion;
        const updated =
          conflict.localVersion.operation === 'delete'
            ? conflict.remoteVersion
            : conflict.localVersion;

        get().mergeRecords(
          { ...conflict, localVersion: updated, remoteVersion: deleted },
          'local'
        );
        resolved.push(conflict);
      } else if (conflict.conflictType === 'concurrent_update') {
        // Last-write-wins
        const isLocalNewer =
          conflict.localVersion.timestamp > conflict.remoteVersion.timestamp;
        get().mergeRecords(conflict, isLocalNewer ? 'local' : 'remote');
        resolved.push(conflict);
      }
    }

    return resolved;
  },

  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: Record<string, any>) => {
    const conflicts = get().conflicts;
    const conflict = conflicts.find((c) => c.id === conflictId);

    if (!conflict) return;

    if (resolution === 'merged' && mergedData) {
      const merged: MergedRecord = {
        id: `${Date.now()}_${Math.random()}`,
        recordId: conflict.recordId,
        type: conflict.recordType,
        mergedData,
        strategy: 'manual',
        vectorClock: get().incrementVectorClock(),
        timestamp: Date.now(),
      };

      const mergedRecords = get().merged;
      set({ merged: [...mergedRecords, merged] });

      const updatedConflicts = conflicts.map((c) =>
        c.id === conflictId ? { ...c, resolved: true, resolution } : c
      );
      set({ conflicts: updatedConflicts });

      const records = get().records.map((r) =>
        r.id === conflict.recordId
          ? {
              ...r,
              data: mergedData,
              vectorClock: merged.vectorClock,
              timestamp: Date.now(),
              operation: 'update' as const,
            }
          : r
      );
      set({ records });
    } else {
      get().mergeRecords(conflict, resolution);
    }

    get().saveToStorage();
  },

  getUnresolvedConflicts: () => {
    return get().conflicts.filter((c) => !c.resolved);
  },

  syncWithBackend: (remoteRecords: CRDTRecord[]) => {
    const localRecords = get().records;

    for (const remoteRecord of remoteRecords) {
      const localRecord = localRecords.find(
        (r) => r.id === remoteRecord.id && r.type === remoteRecord.type
      );

      if (!localRecord) {
        // Remote record doesn't exist locally, add it
        const records = get().records;
        set({ records: [...records, remoteRecord] });
      } else {
        // Check for conflicts
        const conflict = get().detectConflict(localRecord, remoteRecord);
        if (!conflict) {
          // No conflict, local is newer or same, skip
        }
      }
    }

    get().saveToStorage();
  },

  saveToStorage: async () => {
    try {
      const { records, conflicts, merged, replicaId, syncQueue } = get();
      await Promise.all([
        AsyncStorage.setItem('crdtRecords', JSON.stringify(records)),
        AsyncStorage.setItem('crdtConflicts', JSON.stringify(conflicts)),
        AsyncStorage.setItem('crdtMerged', JSON.stringify(merged)),
        AsyncStorage.setItem('crdtReplicaId', replicaId),
        AsyncStorage.setItem('crdtSyncQueue', JSON.stringify(syncQueue)),
      ]);
    } catch (error) {
      console.error('Failed to save CRDT data:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      const [recordsJson, conflictsJson, mergedJson, replicaId, syncQueueJson] = await Promise.all(
        [
          AsyncStorage.getItem('crdtRecords'),
          AsyncStorage.getItem('crdtConflicts'),
          AsyncStorage.getItem('crdtMerged'),
          AsyncStorage.getItem('crdtReplicaId'),
          AsyncStorage.getItem('crdtSyncQueue'),
        ]
      );

      if (recordsJson) set({ records: JSON.parse(recordsJson) });
      if (conflictsJson) set({ conflicts: JSON.parse(conflictsJson) });
      if (mergedJson) set({ merged: JSON.parse(mergedJson) });
      if (replicaId) set({ replicaId });
      if (syncQueueJson) set({ syncQueue: JSON.parse(syncQueueJson) });
    } catch (error) {
      console.error('Failed to load CRDT data:', error);
    }
  },
}));
