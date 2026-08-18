import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TripsService } from './trips.service';

@Controller('api/v1/trips')
@UseGuards(AuthGuard('jwt'))
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Post()
  async createTrip(@Body() dto: any) {
    return this.tripsService.createTrip(dto.tenant_id, dto);
  }

  @Get()
  async getTrips(@Query('tenant_id') tenantId: number, @Query('skip') skip = 0, @Query('take') take = 10) {
    return this.tripsService.getTrips(tenantId, skip, take);
  }

  @Get(':id')
  async getTripById(@Param('id') tripId: number, @Query('tenant_id') tenantId: number) {
    return this.tripsService.getTripById(tenantId, tripId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') tripId: number,
    @Body() dto: { status: string; tenant_id: number; user_id: number },
  ) {
    return this.tripsService.updateTripStatus(dto.tenant_id, tripId, dto.status, dto.user_id);
  }

  @Post(':id/location')
  async updateLocation(
    @Param('id') driverId: number,
    @Body() dto: { latitude: number; longitude: number; tenant_id: number },
  ) {
    return this.tripsService.updateDriverLocation(dto.tenant_id, driverId, dto.latitude, dto.longitude);
  }

  @Post(':id/notify')
  async notifyDriver(
    @Param('id') driverId: number,
    @Body() dto: { tenant_id: number; message: string; data: any },
  ) {
    return this.tripsService.notifyDriver(dto.tenant_id, driverId, {
      message: dto.message,
      data: dto.data,
    });
  }
}
