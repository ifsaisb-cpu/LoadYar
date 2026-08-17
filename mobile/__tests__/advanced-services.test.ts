import { notificationService } from '../src/services/notifications';

describe('Notification Service', () => {
  describe('sendLocalNotification', () => {
    it('should send trip assigned notification', async () => {
      await notificationService.sendLocalNotification({
        type: 'trip_assigned',
        title: 'New Trip Assigned',
        body: 'Pickup: Customer Name',
        data: { tripId: 123, action: 'view_trip' },
      });

      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('trip_assigned');
    });

    it('should send delivery status notification', async () => {
      await notificationService.sendLocalNotification({
        type: 'delivery_status',
        title: 'Delivery Confirmed',
        body: 'Trip #123 status updated',
        data: { tripId: 123 },
      });

      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'delivery_status')).toBe(true);
    });

    it('should send payment alert notification', async () => {
      await notificationService.sendLocalNotification({
        type: 'payment_alert',
        title: 'Payment Received',
        body: '₨ 5,000.00 received',
        data: { invoiceId: 456 },
      });

      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'payment_alert')).toBe(true);
    });
  });

  describe('getStoredNotifications', () => {
    it('should return stored notifications', async () => {
      await notificationService.sendLocalNotification({
        type: 'urgent',
        title: 'Urgent Alert',
        body: 'Important message',
      });

      const notifications = await notificationService.getStoredNotifications();
      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      await notificationService.clearNotifications();
    });

    it('should count unread notifications', async () => {
      await notificationService.sendLocalNotification({
        type: 'trip_assigned',
        title: 'Trip 1',
        body: 'Test',
      });

      await notificationService.sendLocalNotification({
        type: 'trip_assigned',
        title: 'Trip 2',
        body: 'Test',
      });

      const count = await notificationService.getUnreadCount();
      expect(count).toBe(2);
    });

    it('should return 0 unread after marking as read', async () => {
      await notificationService.sendLocalNotification({
        type: 'trip_assigned',
        title: 'Trip',
        body: 'Test',
      });

      const notifications = await notificationService.getStoredNotifications();
      if (notifications.length > 0) {
        await notificationService.markNotificationAsRead(notifications[0].id);
      }

      const count = await notificationService.getUnreadCount();
      expect(count).toBe(0);
    });
  });

  describe('markNotificationAsRead', () => {
    beforeEach(async () => {
      await notificationService.clearNotifications();
    });

    it('should mark notification as read', async () => {
      await notificationService.sendLocalNotification({
        type: 'trip_assigned',
        title: 'Trip',
        body: 'Test',
      });

      const notifications = await notificationService.getStoredNotifications();
      expect(notifications[0].read).toBe(false);

      await notificationService.markNotificationAsRead(notifications[0].id);

      const updated = await notificationService.getStoredNotifications();
      expect(updated[0].read).toBe(true);
    });
  });

  describe('convenience notification methods', () => {
    beforeEach(async () => {
      await notificationService.clearNotifications();
    });

    it('should send trip assigned with convenience method', async () => {
      notificationService.notifyTripAssigned(123, 'Ali Khan');
      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'trip_assigned')).toBe(true);
    });

    it('should send delivery status with convenience method', async () => {
      notificationService.notifyDeliveryStatus(123, 'delivered');
      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'delivery_status')).toBe(true);
    });

    it('should send payment alert with convenience method', async () => {
      notificationService.notifyPaymentAlert(456, 500000);
      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'payment_alert')).toBe(true);
    });

    it('should send maintenance alert', async () => {
      notificationService.notifyMaintenance(789, 'Oil change required');
      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'maintenance')).toBe(true);
    });

    it('should send urgent alert', async () => {
      notificationService.notifyUrgent('System Alert', 'Critical issue');
      const notifications = await notificationService.getStoredNotifications();
      expect(notifications.some((n) => n.type === 'urgent')).toBe(true);
    });
  });

  describe('clearNotifications', () => {
    it('should clear all notifications', async () => {
      await notificationService.sendLocalNotification({
        type: 'trip_assigned',
        title: 'Trip',
        body: 'Test',
      });

      await notificationService.clearNotifications();
      const notifications = await notificationService.getStoredNotifications();
      expect(notifications).toHaveLength(0);
    });
  });
});

describe('Toast Service', () => {
  it('should have success method', () => {
    const toastService = require('../src/services/toast').toastService;
    expect(toastService.success).toBeDefined();
    expect(typeof toastService.success).toBe('function');
  });

  it('should have error method', () => {
    const toastService = require('../src/services/toast').toastService;
    expect(toastService.error).toBeDefined();
    expect(typeof toastService.error).toBe('function');
  });

  it('should have warning method', () => {
    const toastService = require('../src/services/toast').toastService;
    expect(toastService.warning).toBeDefined();
    expect(typeof toastService.warning).toBe('function');
  });

  it('should handle API errors', () => {
    const toastService = require('../src/services/toast').toastService;
    expect(toastService.handleApiError).toBeDefined();
    expect(typeof toastService.handleApiError).toBe('function');
  });

  it('should handle validation errors', () => {
    const toastService = require('../src/services/toast').toastService;
    expect(toastService.handleValidationError).toBeDefined();
    expect(typeof toastService.handleValidationError).toBe('function');
  });
});

describe('Map Service', () => {
  it('should initialize map cache', async () => {
    const mapService = require('../src/services/maps').mapService;
    await mapService.init();
    expect(mapService).toBeDefined();
  });

  it('should get cached regions', async () => {
    const mapService = require('../src/services/maps').mapService;
    await mapService.init();
    const regions = await mapService.getCachedRegions();
    expect(Array.isArray(regions)).toBe(true);
  });

  it('should calculate cache size', async () => {
    const mapService = require('../src/services/maps').mapService;
    await mapService.init();
    const size = await mapService.getCacheSize();
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThanOrEqual(0);
  });
});
