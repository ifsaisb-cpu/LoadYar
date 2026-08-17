import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SectionList,
} from 'react-native';
import { useNotificationsStore } from '../../store/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const getNotificationIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    trip_assigned: '📦',
    delivery_status: '🚚',
    payment_alert: '💳',
    maintenance: '🔧',
    urgent: '🚨',
  };
  return icons[type] || '📢';
};

const getNotificationColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    trip_assigned: '#FF9800',
    delivery_status: '#2196F3',
    payment_alert: '#4CAF50',
    maintenance: '#9C27B0',
    urgent: '#d32f2f',
  };
  return colors[type] || '#666';
};

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    handleNotificationTap,
  } = useNotificationsStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    Alert.alert('Mark all as read?', 'This action cannot be undone.', [
      { text: 'Cancel' },
      {
        text: 'Mark All',
        onPress: () => markAllAsRead(),
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear all notifications?', 'This action cannot be undone.', [
      { text: 'Cancel' },
      {
        text: 'Clear All',
        onPress: () => clearNotifications(),
        style: 'destructive',
      },
    ]);
  };

  const groupedNotifications = notifications.reduce(
    (groups, notification) => {
      const date = dayjs(notification.timestamp).format('YYYY-MM-DD');
      const group = groups.find((g) => g.title === date);

      if (group) {
        group.data.push(notification);
      } else {
        groups.push({
          title: date,
          data: [notification],
        });
      }

      return groups;
    },
    [] as Array<{ title: string; data: typeof notifications }>
  );

  const renderNotification = ({ item }: { item: (typeof notifications)[0] }) => {
    const icon = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);
    const timeAgo = dayjs(item.timestamp).fromNow();

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.notificationCardUnread,
        ]}
        onPress={() => {
          handleMarkAsRead(item.id);
          handleNotificationTap(item);
        }}
      >
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.timestamp}>{timeAgo}</Text>
        </View>

        {!item.read && (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <Text style={styles.markReadText}>✓</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <Text style={styles.sectionHeader}>{dayjs(title).format('MMM D, YYYY')}</Text>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
          )}
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.headerBtnText}>Mark All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerBtn, styles.headerBtnDanger]}
              onPress={handleClearAll}
            >
              <Text style={styles.headerBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You'll see trip assignments, deliveries, and payment alerts here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  unreadBadge: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  headerBtnDanger: {
    backgroundColor: '#ffebee',
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066cc',
  },
  body: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  markReadBtn: {
    paddingHorizontal: 8,
  },
  markReadText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
