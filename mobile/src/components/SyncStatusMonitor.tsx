import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { syncService } from '../services/syncService';
import ConflictResolver from './ConflictResolver';
import type { SyncResult } from '../services/syncService';

interface SyncStatusMonitorProps {
  onConflictsDetected?: (count: number) => void;
}

export const SyncStatusMonitor: React.FC<SyncStatusMonitorProps> = ({ onConflictsDetected }) => {
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());
  const [conflictStatus, setConflictStatus] = useState(syncService.getConflictStatus());
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Monitor sync status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
      setConflictStatus(syncService.getConflictStatus());

      // Notify if conflicts were detected
      if (conflictStatus.unresolvedCount > 0 && onConflictsDetected) {
        onConflictsDetected(conflictStatus.unresolvedCount);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conflictStatus.unresolvedCount, onConflictsDetected]);

  const handleManualSync = useCallback(async () => {
    setIsManualSyncing(true);

    try {
      const result = await syncService.startSync({
        autoResolveConflicts: true,
      });

      setLastSyncResult(result);

      if (result.errors.length === 0) {
        Alert.alert(
          'Sync Complete',
          `✓ Synced: ${result.synced}\n📊 Conflicts: ${result.conflicts}\n✓ Resolved: ${result.resolved}\n⏱️ Duration: ${result.duration}ms`
        );
      } else {
        Alert.alert(
          'Sync Completed with Errors',
          `Synced: ${result.synced}\nErrors: ${result.errors.length}\n${result.errors
            .slice(0, 3)
            .join('\n')}`
        );
      }

      // Refresh conflict status
      setConflictStatus(syncService.getConflictStatus());
    } catch (error) {
      Alert.alert('Sync Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsManualSyncing(false);
    }
  }, []);

  const handleResolveConflicts = useCallback(() => {
    if (conflictStatus.unresolvedCount === 0) {
      Alert.alert('No Conflicts', 'All data is synchronized.');
      return;
    }
    setShowConflictResolver(true);
  }, [conflictStatus.unresolvedCount]);

  const getTimeString = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms ago`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
    return `${Math.round(ms / 60000)}m ago`;
  };

  const getSyncIndicator = () => {
    if (syncStatus.isSyncing) {
      return { icon: '🔄', color: '#3b82f6', text: 'Syncing...' };
    }

    if (conflictStatus.unresolvedCount > 0) {
      return { icon: '⚠️', color: '#ef4444', text: `${conflictStatus.unresolvedCount} Conflict(s)` };
    }

    const timeSinceSync = syncStatus.timeSinceLastSync;
    if (timeSinceSync < 5000) {
      return { icon: '✓', color: '#10b981', text: 'Synced' };
    }

    return { icon: '⏱️', color: '#f59e0b', text: getTimeString(timeSinceSync) };
  };

  const indicator = getSyncIndicator();

  return (
    <>
      <View style={styles.container}>
        {/* Sync Status Bar */}
        <TouchableOpacity
          style={[styles.statusBar, { borderBottomColor: indicator.color }]}
          onPress={handleManualSync}
          disabled={syncStatus.isSyncing}
        >
          <View style={styles.statusLeft}>
            <Text style={styles.statusIcon}>{indicator.icon}</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Sync Status</Text>
              <Text style={[styles.statusValue, { color: indicator.color }]}>
                {indicator.text}
              </Text>
            </View>
          </View>

          {isManualSyncing && <ActivityIndicator size="small" color={indicator.color} />}
          {!syncStatus.isSyncing && !isManualSyncing && (
            <Text style={styles.refreshIcon}>↻</Text>
          )}
        </TouchableOpacity>

        {/* Conflict Badge */}
        {conflictStatus.unresolvedCount > 0 && (
          <TouchableOpacity
            style={styles.conflictBadge}
            onPress={handleResolveConflicts}
          >
            <Text style={styles.conflictBadgeIcon}>⚠️</Text>
            <View style={styles.conflictBadgeInfo}>
              <Text style={styles.conflictBadgeLabel}>Unresolved Conflicts</Text>
              <Text style={styles.conflictBadgeCount}>{conflictStatus.unresolvedCount}</Text>
            </View>
            <Text style={styles.conflictBadgeArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Last Sync Details */}
        {lastSyncResult && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Last Sync Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📤 Synced Records:</Text>
              <Text style={styles.detailValue}>{lastSyncResult.synced}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⚠️ Conflicts Detected:</Text>
              <Text style={[styles.detailValue, { color: '#ef4444' }]}>
                {lastSyncResult.conflicts}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>✓ Auto-Resolved:</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>
                {lastSyncResult.resolved}
              </Text>
            </View>

            {lastSyncResult.errors.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>❌ Errors:</Text>
                <Text style={[styles.detailValue, { color: '#ef4444' }]}>
                  {lastSyncResult.errors.length}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏱️ Duration:</Text>
              <Text style={styles.detailValue}>{lastSyncResult.duration}ms</Text>
            </View>
          </View>
        )}

        {/* Sync Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 About Sync</Text>
          <Text style={styles.infoText}>
            • Your data is automatically synced with the server every 5 seconds
          </Text>
          <Text style={styles.infoText}>
            • When conflicts occur, we intelligently merge your changes with server data
          </Text>
          <Text style={styles.infoText}>
            • Manual sync: Pull down or tap the sync status bar
          </Text>
          <Text style={styles.infoText}>
            • Tap conflict badge to review and resolve conflicts manually
          </Text>
        </View>

        {/* Conflict Status Grid */}
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardLabel}>Total Conflicts</Text>
            <Text style={styles.cardValue}>{conflictStatus.totalCount}</Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.cardIcon}>✓</Text>
            <Text style={styles.cardLabel}>Resolved</Text>
            <Text style={styles.cardValue}>{conflictStatus.resolvedCount}</Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.cardIcon}>⏳</Text>
            <Text style={styles.cardLabel}>Unresolved</Text>
            <Text style={styles.cardValue}>{conflictStatus.unresolvedCount}</Text>
          </View>
        </View>
      </View>

      {/* Conflict Resolver Modal */}
      <Modal visible={showConflictResolver} animationType="slide">
        <ConflictResolver onClose={() => setShowConflictResolver(false)} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#999',
  },
  conflictBadge: {
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  conflictBadgeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  conflictBadgeInfo: {
    flex: 1,
  },
  conflictBadgeLabel: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
  },
  conflictBadgeCount: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 'bold',
    marginTop: 2,
  },
  conflictBadgeArrow: {
    fontSize: 16,
    color: '#ef4444',
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    padding: 14,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoCard: {
    backgroundColor: '#e0f2fe',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#1a1a1a',
    lineHeight: 16,
    marginBottom: 6,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
});

export default SyncStatusMonitor;
