import * as Notifications from 'expo-notifications';
import { storageService } from './storage';

export interface NotificationPayload {
  type: 'trip_assigned' | 'delivery_status' | 'payment_alert' | 'maintenance' | 'urgent';
  title: string;
  body: string;
  data?: {
    tripId?: number;
    invoiceId?: number;
    action?: string;
    deepLink?: string;
  };
}

export interface StoredNotification extends NotificationPayload {
  id: string;
  timestamp: string;
  read: boolean;
}

class NotificationService {
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();

      if (settings.status === 'undetermined') {
        const permission = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });

        return permission.granted;
      }

      return settings.granted;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async setupNotificationHandler(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
  ): Promise<void> {
    try {
      // Set up notification handling for when app is foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Listen for incoming notifications
      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
          onNotificationReceived(notification);
          this.storeNotification(notification.request.content.data as NotificationPayload);
        }
      );

      // Listen for notification taps
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          onNotificationResponse(response);
          this.markNotificationAsRead(response.notification.request.identifier);
        }
      );
    } catch (error) {
      console.error('Setup notification handler error:', error);
    }
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: 1,
        },
        trigger: null,
      });

      this.storeNotification(payload);
    } catch (error) {
      console.error('Send local notification error:', error);
    }
  }

  private async storeNotification(payload: NotificationPayload): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const newNotification: StoredNotification = {
        ...payload,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      notifications.unshift(newNotification);
      await storageService.setItem('notifications', notifications.slice(0, 50)); // Keep last 50
    } catch (error) {
      console.error('Store notification error:', error);
    }
  }

  async getStoredNotifications(): Promise<StoredNotification[]> {
    try {
      const notifications = await storageService.getItem('notifications');
      return notifications || [];
    } catch (error) {
      console.error('Get stored notifications error:', error);
      return [];
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      await storageService.setItem('notifications', updated);
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  }

  async clearNotifications(): Promise<void> {
    try {
      await storageService.removeItem('notifications');
    } catch (error) {
      console.error('Clear notifications error:', error);
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getStoredNotifications();
      return notifications.filter((n) => !n.read).length;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  notifyTripAssigned(tripId: number, consignee: string): void {
    this.sendLocalNotification({
      type: 'trip_assigned',
      title: '📦 New Trip Assigned',
      body: `Pickup: ${consignee}`,
      data: { tripId, action: 'view_trip', deepLink: `/trips/${tripId}` },
    });
  }

  notifyDeliveryStatus(tripId: number, status: string): void {
    const statusMessages: { [key: string]: string } = {
      in_transit: '🚚 Trip in transit',
      delivered: '✅ Delivery confirmed',
      pending: '⏳ Awaiting pickup',
    };

    this.sendLocalNotification({
      type: 'delivery_status',
      title: statusMessages[status] || 'Trip Update',
      body: `Trip #${tripId} status updated`,
      data: { tripId, action: 'view_trip', deepLink: `/trips/${tripId}` },
    });
  }

  notifyPaymentAlert(invoiceId: number, amount: number): void {
    this.sendLocalNotification({
      type: 'payment_alert',
      title: '💳 Payment Received',
      body: `₨ ${(amount / 100).toLocaleString()} received`,
      data: { invoiceId, action: 'view_invoice' },
    });
  }

  notifyMaintenance(vehicleId: number, issue: string): void {
    this.sendLocalNotification({
      type: 'maintenance',
      title: '🔧 Maintenance Required',
      body: issue,
      data: { vehicleId, action: 'schedule_maintenance' },
    });
  }

  notifyUrgent(title: string, message: string): void {
    this.sendLocalNotification({
      type: 'urgent',
      title: `🚨 ${title}`,
      body: message,
    });
  }

  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export const notificationService = new NotificationService();
