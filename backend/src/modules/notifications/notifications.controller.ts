import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('device-token/register')
  async registerDeviceToken(@Body() dto: any) {
    return this.notificationsService.registerDeviceToken(
      dto.tenant_id,
      dto.user_id,
      dto.fcm_token,
      dto.device_info,
    );
  }

  @Post('device-token/unregister')
  async unregisterDeviceToken(@Body() dto: any) {
    return this.notificationsService.unregisterDeviceToken(
      dto.tenant_id,
      dto.user_id,
      dto.fcm_token,
    );
  }

  @Get('device-tokens/:user_id')
  async getDeviceTokens(
    @Param('user_id') userId: number,
    @Query('tenant_id') tenantId: number,
  ) {
    return this.notificationsService.getDeviceTokens(tenantId, userId);
  }

  @Post('send/trip-assignment')
  async sendTripAssignmentNotification(@Body() dto: any) {
    return this.notificationsService.sendTripAssignmentNotification(
      dto.tenant_id,
      dto.driver_id,
      dto.trip_data,
    );
  }

  @Post('send/delivery-status')
  async sendDeliveryStatusNotification(@Body() dto: any) {
    return this.notificationsService.sendDeliveryStatusNotification(
      dto.tenant_id,
      dto.driver_id,
      dto.trip_id,
      dto.status,
    );
  }

  @Post('send/geofence-alert')
  async sendGeofenceAlert(@Body() dto: any) {
    return this.notificationsService.sendGeofenceAlert(
      dto.tenant_id,
      dto.driver_id,
      dto.geofence_name,
      dto.alert_type,
    );
  }

  @Post('send/payment')
  async sendPaymentNotification(@Body() dto: any) {
    return this.notificationsService.sendPaymentNotification(
      dto.tenant_id,
      dto.user_id,
      dto.payment_data,
    );
  }

  @Post('send/invoice')
  async sendInvoiceNotification(@Body() dto: any) {
    return this.notificationsService.sendInvoiceNotification(
      dto.tenant_id,
      dto.user_id,
      dto.invoice_data,
    );
  }

  @Post('send/custom')
  async sendCustomNotification(@Body() dto: any) {
    return this.notificationsService.sendCustomNotification(
      dto.tenant_id,
      dto.user_id,
      dto.payload,
    );
  }

  @Get('history/:user_id')
  async getNotificationHistory(
    @Param('user_id') userId: number,
    @Query('tenant_id') tenantId: number,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.notificationsService.getNotificationHistory(tenantId, userId, skip, take);
  }

  @Get('unread/:user_id')
  async getUnreadCount(
    @Param('user_id') userId: number,
    @Query('tenant_id') tenantId: number,
  ) {
    return this.notificationsService.getUnreadCount(tenantId, userId);
  }

  @Put('mark-read/:notification_id')
  async markNotificationAsRead(
    @Param('notification_id') notificationId: number,
    @Query('tenant_id') tenantId: number,
  ) {
    return this.notificationsService.markNotificationAsRead(notificationId, tenantId);
  }
}
