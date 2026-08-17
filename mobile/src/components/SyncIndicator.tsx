import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { storageService } from '../services/storage';
import { apiClient } from '../services/api';

export default function SyncIndicator() {
  const [queueLength, setQueueLength] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadQueueStatus = async () => {
    const queue = await storageService.getSyncQueue();
    setQueueLength(queue.length);

    const lastSync = await storageService.getItem('last_sync_time');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiClient.syncQueue();
      await storageService.setItem('last_sync_time', new Date().toISOString());
      await loadQueueStatus();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (queueLength === 0 && isOnline) {
    return null;
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isOnline && styles.containerOffline,
        queueLength > 0 && styles.containerPending,
      ]}
      onPress={handleSync}
      disabled={isSyncing}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator size="small" color="#0066cc" />
        ) : queueLength > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{queueLength}</Text>
          </View>
        ) : (
          <View style={styles.checkmark} />
        )}

        <View style={styles.textContainer}>
          {queueLength > 0 ? (
            <>
              <Text style={styles.label}>
                {queueLength} pending {queueLength === 1 ? 'change' : 'changes'}
              </Text>
              <Text style={styles.description}>Tap to sync now</Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>All synced</Text>
              <Text style={styles.description}>Last: {formatTime(lastSyncTime)}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#d1e7dd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#badbcc',
  },
  containerOffline: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  containerPending: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#28a745',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});
