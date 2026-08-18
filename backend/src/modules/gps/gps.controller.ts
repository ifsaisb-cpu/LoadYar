import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GpsService } from './gps.service';

@Controller('api/v1/gps')
@UseGuards(AuthGuard('jwt'))
export class GpsController {
  constructor(private gpsService: GpsService) {}

  @Post('location')
  async recordLocation(@Body() dto: any) {
    return this.gpsService.recordLocation(dto.tenant_id, {
      driver_id: dto.driver_id,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      speed_kmh: dto.speed_kmh,
      heading: dto.heading,
      altitude: dto.altitude,
      recorded_at: new Date(),
    });
  }

  @Get('driver/:driver_id/location')
  async getDriverLocation(@Param('driver_id') driverId: number, @Query('tenant_id') tenantId: number): Promise<any> {
    return this.gpsService.getDriverLocation(tenantId, driverId);
  }

  @Get('locations')
  async getAllLocations(@Query('tenant_id') tenantId: number): Promise<any[]> {
    return this.gpsService.getAllDriverLocations(tenantId);
  }

  @Post('eta')
  async calculateETA(@Body() dto: any) {
    return this.gpsService.calculateETA(
      dto.current_latitude,
      dto.current_longitude,
      dto.dest_latitude,
      dto.dest_longitude,
      dto.avg_speed || 40,
    );
  }

  @Post('route/optimize')
  async optimizeRoute(@Body() dto: any) {
    return this.gpsService.optimizeRoute(dto.waypoints);
  }

  @Post('route/snapshot')
  async generateRouteSnapshot(@Body() dto: any) {
    return this.gpsService.generateRouteSnapshot(
      dto.trip_id,
      dto.driver_id,
      dto.tenant_id,
      dto.waypoints,
    );
  }

  @Post('geofence')
  async createGeofence(@Body() dto: any) {
    return this.gpsService.createGeofence(dto.tenant_id, {
      id: Math.floor(Math.random() * 10000),
      center_lat: dto.center_latitude,
      center_lng: dto.center_longitude,
      radius_m: dto.radius_meters,
      type: dto.type,
      name: dto.name,
    });
  }

  @Get('geofences')
  async getGeofences(@Query('tenant_id') tenantId: number): Promise<any[]> {
    return this.gpsService.getGeofences(tenantId);
  }

  @Get('route/distance')
  async getRouteDistance(@Body() dto: any) {
    return {
      distance_km: this.gpsService.calculateRouteDistance(dto.waypoints),
    };
  }
}
