import { Injectable } from '@nestjs/common';
import { TripsGateway } from './trips.gateway';

@Injectable()
export class TripsService {
  constructor(private tripsGateway: TripsGateway) {}

  async createTrip(tenantId: number, tripData: any) {
    const trip = {
      id: Math.floor(Math.random() * 10000),
      tenant_id: tenantId,
      status: 'pending',
      created_at: new Date(),
      ...tripData,
    };

    this.tripsGateway.broadcastTripUpdate(tenantId, trip);
    return trip;
  }

  async updateTripStatus(tenantId: number, tripId: number, newStatus: string, userId: number) {
    const statusChange = {
      trip_id: tripId,
      new_status: newStatus,
      changed_by: userId,
      timestamp: new Date(),
    };

    this.tripsGateway.broadcastToTenant(tenantId, 'trip:status-changed', statusChange);
    return statusChange;
  }

  async updateDriverLocation(tenantId: number, driverId: number, lat: number, lng: number) {
    const location = {
      driver_id: driverId,
      latitude: lat,
      longitude: lng,
      timestamp: new Date(),
    };

    this.tripsGateway.broadcastToTenant(tenantId, 'location:updated', location);
    return location;
  }

  async notifyDriver(tenantId: number, driverId: number, notification: any) {
    this.tripsGateway.notifyUser(tenantId, driverId, {
      type: 'trip-assignment',
      ...notification,
    });

    return { success: true, timestamp: new Date() };
  }

  async broadcastTenantUpdate(tenantId: number, event: string, data: any) {
    this.tripsGateway.broadcastToTenant(tenantId, event, data);
  }

  getTrips(tenantId: number, skip = 0, take = 10) {
    return {
      trips: [],
      total: 0,
      message: 'Fetch trips from database',
    };
  }

  getTripById(tenantId: number, tripId: number) {
    return {
      id: tripId,
      tenant_id: tenantId,
      status: 'active',
      message: 'Fetch trip from database',
    };
  }
}
