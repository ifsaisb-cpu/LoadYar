import { create } from 'zustand';
import { notificationService, StoredNotification } from '../services/notifications';

interface NotificationsState {
  // State
  notifications: StoredNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  getUnreadCount: () => Promise<number>;
  handleNotificationTap: (notification: StoredNotification) => void;
  clearError: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await notificationService.getStoredNotifications();
      const unreadCount = notifications.filter((n) => !n.read).length;

      set({
        notifications,
        unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      const state = get();
      for (const notification of state.notifications.filter((n) => !n.read)) {
        await notificationService.markNotificationAsRead(notification.id);
      }

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearNotifications: async () => {
    try {
      await notificationService.clearNotifications();
      set({
        notifications: [],
        unreadCount: 0,
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  getUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
      return count;
    } catch (error: any) {
      set({ error: error.message });
      return 0;
    }
  },

  handleNotificationTap: (notification: StoredNotification) => {
    // Mark as read
    get().markAsRead(notification.id);

    // Handle deep links
    if (notification.data?.deepLink) {
      // TODO: Use React Navigation to navigate to deep link
      console.log(`Navigate to: ${notification.data.deepLink}`);
    }
  },

  clearError: () => set({ error: null }),
}));
