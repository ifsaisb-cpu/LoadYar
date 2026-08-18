import { Injectable } from '@nestjs/common';
import { TripsGateway } from '../trips/trips.gateway';

interface FCMPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  deepLink?: string;
}

@Injectable()
export class NotificationsService {
  private deviceTokens = new Map<string, Set<string>>();
  private notifications: any[] = [];

  constructor(private tripsGateway: TripsGateway) {
    this.initializeSampleTokens();
  }

  private initializeSampleTokens() {
    this.deviceTokens.set('1-1', new Set([
      'fcm_token_driver_1_device_1',
      'fcm_token_driver_1_device_2',
    ]));
    this.deviceTokens.set('1-2', new Set([
      'fcm_token_driver_2_device_1',
    ]));
  }

  async registerDeviceToken(tenantId: number, userId: number, token: string, deviceInfo?: any) {
    const key = `${tenantId}-${userId}`;
    if (!this.deviceTokens.has(key)) {
      this.deviceTokens.set(key, new Set());
    }
    this.deviceTokens.get(key).add(token);

    return {
      success: true,
      message: 'Device token registered',
      user_id: userId,
      device_count: this.deviceTokens.get(key).size,
    };
  }

  async unregisterDeviceToken(tenantId: number, userId: number, token: string) {
    const key = `${tenantId}-${userId}`;
    if (this.deviceTokens.has(key)) {
      this.deviceTokens.get(key).delete(token);
    }
    return { success: true, message: 'Device token unregistered' };
  }

  async sendTripAssignmentNotification(tenantId: number, driverId: number, tripData: any) {
    const notification = {
      type: 'trip_assignment',
      title: 'New Trip Assigned',
      body: `${tripData.route || 'New delivery'} assigned to you`,
      data: {
        trip_id: tripData.trip_id?.toString(),
        pickup_location: tripData.pickup_location,
        delivery_location: tripData.delivery_location,
        estimated_distance: tripData.estimated_distance?.toString(),
      },
      deepLink: `app://trips/${tripData.trip_id}`,
    };

    return this.sendNotification(tenantId, driverId, notification);
  }

  async sendDeliveryStatusNotification(tenantId: number, driverId: number, tripId: number, status: string) {
    const statusMessages = {
      pending: 'Trip pending',
      in_transit: 'In transit to delivery location',
      arrived: 'Arrived at delivery location',
      completed: 'Delivery completed',
      failed: 'Delivery failed',
    };

    const notification = {
      type: 'delivery_status',
      title: 'Trip Status Update',
      body: statusMessages[status] || `Status: ${status}`,
      data: {
        trip_id: tripId?.toString(),
        status: status,
      },
      deepLink: `app://trips/${tripId}`,
    };

    return this.sendNotification(tenantId, driverId, notification);
  }

  async sendGeofenceAlert(tenantId: number, driverId: number, geofenceName: string, alertType: string) {
    const notification = {
      type: 'geofence_alert',
      title: '⚠️ Geofence Alert',
      body: `${alertType === 'entered_restricted' ? 'Entering restricted area: ' : 'Entered: '}${geofenceName}`,
      data: {
        driver_id: driverId?.toString(),
        geofence_name: geofenceName,
        alert_type: alertType,
      },
      deepLink: 'app://map',
    };

    return this.sendNotification(tenantId, driverId, notification);
  }

  async sendPaymentNotification(tenantId: number, userId: number, paymentData: any) {
    const notification = {
      type: 'payment',
      title: '💳 Payment Received',
      body: `Payment of ₨${paymentData.amount} received via ${paymentData.method}`,
      data: {
        payment_id: paymentData.payment_id?.toString(),
        amount: paymentData.amount?.toString(),
        method: paymentData.method,
      },
      deepLink: 'app://invoices',
    };

    return this.sendNotification(tenantId, userId, notification);
  }

  async sendInvoiceNotification(tenantId: number, userId: number, invoiceData: any) {
    const notification = {
      type: 'payment',
      title: '📋 New Invoice',
      body: `Invoice #${invoiceData.invoice_number} for ₨${invoiceData.amount} generated`,
      data: {
        invoice_id: invoiceData.invoice_id?.toString(),
        invoice_number: invoiceData.invoice_number,
        amount: invoiceData.amount?.toString(),
      },
      deepLink: `app://invoices/${invoiceData.invoice_id}`,
    };

    return this.sendNotification(tenantId, userId, notification);
  }

  async sendCustomNotification(tenantId: number, userId: number, payload: FCMPayload) {
    const notification = {
      type: 'custom',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      deepLink: payload.deepLink,
    };

    return this.sendNotification(tenantId, userId, notification);
  }

  private async sendNotification(tenantId: number, userId: number, notificationPayload: any) {
    const key = `${tenantId}-${userId}`;
    const tokens = this.deviceTokens.get(key) || new Set();

    if (tokens.size === 0) {
      return {
        success: false,
        message: 'No device tokens registered for user',
        delivered_count: 0,
      };
    }

    const deliveredTokens: string[] = [];

    for (const token of tokens) {
      try {
        await this.simulateFCMSend(token, notificationPayload);
        deliveredTokens.push(token);
      } catch (error) {
        console.error(`Failed to send to token ${token}:`, error);
      }
    }

    this.notifications.push({
      id: Math.floor(Math.random() * 10000),
      tenant_id: tenantId,
      user_id: userId,
      ...notificationPayload,
      sent_at: new Date(),
      status: 'delivered',
      delivered_to: deliveredTokens.length,
    });

    this.tripsGateway.broadcastToTenant(tenantId, 'notification:sent', {
      type: notificationPayload.type,
      user_id: userId,
      title: notificationPayload.title,
      delivered_count: deliveredTokens.length,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Notification sent to ${deliveredTokens.length} device(s)`,
      delivered_count: deliveredTokens.length,
      timestamp: new Date(),
    };
  }

  private simulateFCMSend(token: string, payload: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[FCM] Sent to ${token.substring(0, 20)}... - ${payload.title}`);
        resolve({ messageId: 'projects/loadyar/messages/' + Math.random() });
      }, 10);
    });
  }

  getNotificationHistory(tenantId: number, userId: number, skip = 0, take = 20) {
    const userNotifications = this.notifications
      .filter((n) => n.tenant_id === tenantId && n.user_id === userId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

    return {
      notifications: userNotifications.slice(skip, skip + take),
      total: userNotifications.length,
    };
  }

  markNotificationAsRead(notificationId: number, tenantId: number) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId && n.tenant_id === tenantId,
    );
    if (notification) {
      notification.is_read = true;
      notification.read_at = new Date();
      return { success: true };
    }
    return { success: false, message: 'Notification not found' };
  }

  getUnreadCount(tenantId: number, userId: number) {
    const unread = this.notifications.filter(
      (n) => n.tenant_id === tenantId && n.user_id === userId && !n.is_read,
    );
    return { unread_count: unread.length };
  }

  getDeviceTokens(tenantId: number, userId: number) {
    const key = `${tenantId}-${userId}`;
    const tokens = this.deviceTokens.get(key) || new Set();
    return {
      user_id: userId,
      device_count: tokens.size,
      tokens: Array.from(tokens).map((t) => ({
        token: t.substring(0, 20) + '...',
        masked_token: t,
      })),
    };
  }
}
