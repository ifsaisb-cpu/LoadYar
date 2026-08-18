import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { syncService } from '../services/syncService';
import { useCRDTStore } from '../store/crdtStore';
import SyncStatusMonitor from '../components/SyncStatusMonitor';
import ConflictResolver from '../components/ConflictResolver';

interface SyncMetrics {
  totalRecords: number;
  vectorClockSize: number;
  syncQueueSize: number;
  conflictCount: number;
  resolvedConflictCount: number;
}

export const SyncDashboardScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalRecords: 0,
    vectorClockSize: 0,
    syncQueueSize: 0,
    conflictCount: 0,
    resolvedConflictCount: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);

  const { records, conflicts, syncQueue } = useCRDTStore();

  useEffect(() => {
    updateMetrics();
  }, [records, conflicts, syncQueue]);

  const updateMetrics = () => {
    const vectorClock = syncService.getCurrentVectorClock();
    const conflictStatus = syncService.getConflictStatus();

    setMetrics({
      totalRecords: records.length,
      vectorClockSize: Object.keys(vectorClock).length,
      syncQueueSize: syncQueue.length,
      conflictCount: conflictStatus.totalCount,
      resolvedConflictCount: conflictStatus.resolvedCount,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await syncService.startSync({
        autoResolveConflicts: true,
      });

      updateMetrics();

      let message = `Synced: ${result.synced} records\n`;
      message += `Conflicts: ${result.conflicts}\n`;
      message += `Resolved: ${result.resolved}\n`;
      message += `Duration: ${result.duration}ms`;

      if (result.errors.length > 0) {
        message += `\n\nErrors: ${result.errors.length}`;
      }

      Alert.alert('Sync Complete', message);
    } catch (error) {
      Alert.alert('Sync Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoResolve = async () => {
    const resolved = await syncService.resolveAllConflicts();
    updateMetrics();
    Alert.alert('Auto-Resolved', `${resolved} conflict(s) resolved automatically`);
  };

  const handleResetSync = () => {
    Alert.alert(
      'Reset Sync State',
      'This will clear all CRDT records and conflicts. Continue?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reset',
          onPress: () => {
            syncService.resetSync();
            updateMetrics();
            Alert.alert('Reset', 'Sync state cleared');
          },
        },
      ]
    );
  };

  const syncStatus = syncService.getSyncStatus();
  const conflictStatus = syncService.getConflictStatus();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>🔄 Sync Dashboard</Text>
          <Text style={styles.headerSubtitle}>CRDT-based conflict-free synchronization</Text>
        </View>

        {/* Sync Status Monitor */}
        <SyncStatusMonitor onConflictsDetected={(count) => {
          if (count > 0) {
            setShowConflictResolver(true);
          }
        }} />

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRefresh}
            disabled={syncStatus.isSyncing}
          >
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionLabel}>Sync Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowConflictResolver(true)}
          >
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={styles.actionLabel}>
              Resolve ({conflictStatus.unresolvedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleAutoResolve}>
            <Text style={styles.actionIcon}>✓</Text>
            <Text style={styles.actionLabel}>Auto-Resolve</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleResetSync}>
            <Text style={styles.actionIcon}>⟲</Text>
            <Text style={styles.actionLabel}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>📊 CRDT Metrics</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>📝</Text>
              <Text style={styles.metricLabel}>Total Records</Text>
              <Text style={styles.metricValue}>{metrics.totalRecords}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🕐</Text>
              <Text style={styles.metricLabel}>Vector Clock</Text>
              <Text style={styles.metricValue}>{metrics.vectorClockSize}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>📤</Text>
              <Text style={styles.metricLabel}>Sync Queue</Text>
              <Text style={styles.metricValue}>{metrics.syncQueueSize}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>⚠️</Text>
              <Text style={styles.metricLabel}>Total Conflicts</Text>
              <Text style={styles.metricValue}>{metrics.conflictCount}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>✓</Text>
              <Text style={styles.metricLabel}>Resolved</Text>
              <Text style={styles.metricValue}>{metrics.resolvedConflictCount}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>⏳</Text>
              <Text style={styles.metricLabel}>Unresolved</Text>
              <Text style={styles.metricValue}>
                {metrics.conflictCount - metrics.resolvedConflictCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Sync Status Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>ℹ️ Sync Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Status:</Text>
            <Text
              style={[
                styles.detailValue,
                { color: syncStatus.isSyncing ? '#3b82f6' : '#10b981' },
              ]}
            >
              {syncStatus.isSyncing ? '🔄 Syncing' : '✓ Ready'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.timeSinceLastSync < 1000
                ? 'Just now'
                : `${Math.round(syncStatus.timeSinceLastSync / 1000)}s ago`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto-Sync Interval:</Text>
            <Text style={styles.detailValue}>Every 5 seconds</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Conflict Resolution:</Text>
            <Text style={styles.detailValue}>Auto + Manual</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔬 How CRDT Works</Text>

          <View style={styles.infoSection}>
            <Text style={styles.infoStep}>1️⃣ Vector Clocks</Text>
            <Text style={styles.infoDesc}>
              Each device maintains a vector clock to track causality between events. This helps determine which events happened before others.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoStep}>2️⃣ Conflict Detection</Text>
            <Text style={styles.infoDesc}>
              When two devices update the same record independently (offline), a conflict is detected by comparing vector clocks.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoStep}>3️⃣ Automatic Merge</Text>
            <Text style={styles.infoDesc}>
              Conflicts are automatically resolved using Last-Write-Wins (LWW) for scalar fields and deep merge for objects.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoStep}>4️⃣ Manual Override</Text>
            <Text style={styles.infoDesc}>
              Users can review and manually choose which version to keep or create a custom merge.
            </Text>
          </View>
        </View>

        {/* Conflict Strategies */}
        <View style={styles.strategyCard}>
          <Text style={styles.sectionTitle}>⚙️ Conflict Strategies</Text>

          <View style={styles.strategyRow}>
            <Text style={styles.strategyType}>Last-Write-Wins (LWW)</Text>
            <Text style={styles.strategyDesc}>
              Uses timestamp to keep the most recent version. Fast and simple.
            </Text>
          </View>

          <View style={styles.strategyRow}>
            <Text style={styles.strategyType}>Vector Clock Order</Text>
            <Text style={styles.strategyDesc}>
              Preserves causality. If VC1 < VC2, VC2's version is kept automatically.
            </Text>
          </View>

          <View style={styles.strategyRow}>
            <Text style={styles.strategyType}>Auto-Merge</Text>
            <Text style={styles.strategyDesc}>
              Combines non-conflicting fields from both versions intelligently.
            </Text>
          </View>

          <View style={styles.strategyRow}>
            <Text style={styles.strategyType}>Manual Resolution</Text>
            <Text style={styles.strategyDesc}>
              User chooses which version to keep or creates a custom merged version.
            </Text>
          </View>
        </View>

        {/* Data Types Supported */}
        <View style={styles.typesCard}>
          <Text style={styles.sectionTitle}>📦 Supported Data Types</Text>

          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>🚗</Text>
            <Text style={styles.typeLabel}>Trip Updates</Text>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>📦</Text>
            <Text style={styles.typeLabel}>Delivery Proof</Text>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>💸</Text>
            <Text style={styles.typeLabel}>Expense Records</Text>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>📍</Text>
            <Text style={styles.typeLabel}>GPS Tracking</Text>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>💳</Text>
            <Text style={styles.typeLabel}>Payment Data</Text>
          </View>
        </View>
      </ScrollView>

      {/* Conflict Resolver Modal */}
      {showConflictResolver && (
        <ConflictResolver onClose={() => setShowConflictResolver(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  metricsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
  },
  infoSection: {
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: '#1a1a1a',
    lineHeight: 18,
  },
  strategyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  strategyRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  strategyType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  strategyDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  typesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});

export default SyncDashboardScreen;
