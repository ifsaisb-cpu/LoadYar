import { Injectable } from '@nestjs/common';
import { TripsGateway } from '../trips/trips.gateway';

interface LocationData {
  driver_id: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed_kmh?: number;
  heading?: number;
  altitude?: number;
  recorded_at: Date;
}

interface GeofenceData {
  id: number;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  type: string;
  name: string;
}

@Injectable()
export class GpsService {
  private geofences = new Map<number, GeofenceData[]>();
  private driverLocations = new Map<string, LocationData>();

  constructor(private tripsGateway: TripsGateway) {
    this.initGeofences();
  }

  private initGeofences() {
    this.geofences.set(1, [
      {
        id: 1,
        center_lat: 24.8607,
        center_lng: 67.0011,
        radius_m: 5000,
        type: 'delivery_zone',
        name: 'Karachi Central',
      },
      {
        id: 2,
        center_lat: 31.5454,
        center_lng: 74.3436,
        radius_m: 5000,
        type: 'delivery_zone',
        name: 'Lahore Central',
      },
      {
        id: 3,
        center_lat: 34.0151,
        center_lng: 71.5249,
        radius_m: 3000,
        type: 'no_entry',
        name: 'Restricted Area',
      },
    ]);
  }

  async recordLocation(tenantId: number, location: LocationData) {
    const key = `${tenantId}-${location.driver_id}`;
    this.driverLocations.set(key, location);

    const locationUpdate = {
      driver_id: location.driver_id,
      latitude: parseFloat(location.latitude.toString()),
      longitude: parseFloat(location.longitude.toString()),
      accuracy: location.accuracy,
      speed_kmh: location.speed_kmh,
      heading: location.heading,
      timestamp: new Date(),
    };

    this.tripsGateway.broadcastToTenant(tenantId, 'location:real-time', locationUpdate);

    await this.checkGeofences(tenantId, location);

    return { success: true, timestamp: new Date() };
  }

  private async checkGeofences(tenantId: number, location: LocationData) {
    const geofences = this.geofences.get(tenantId) || [];

    for (const geofence of geofences) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.center_lat,
        geofence.center_lng,
      );

      if (distance <= geofence.radius_m / 1000) {
        if (geofence.type === 'delivery_zone') {
          this.tripsGateway.broadcastToTenant(tenantId, 'geofence:entered', {
            driver_id: location.driver_id,
            geofence_id: geofence.id,
            geofence_name: geofence.name,
            geofence_type: geofence.type,
            timestamp: new Date(),
          });
        } else if (geofence.type === 'no_entry') {
          this.tripsGateway.broadcastToTenant(tenantId, 'geofence:alert', {
            driver_id: location.driver_id,
            geofence_id: geofence.id,
            geofence_name: geofence.name,
            alert: 'ENTERING_RESTRICTED_AREA',
            timestamp: new Date(),
          });
        }
      }
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateETA(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    avgSpeed: number = 40,
  ) {
    const distanceKm = this.calculateDistance(currentLat, currentLng, destLat, destLng);
    const timeMinutes = Math.round((distanceKm / avgSpeed) * 60);

    return {
      distance_km: Math.round(distanceKm * 100) / 100,
      estimated_time_minutes: timeMinutes,
      estimated_arrival: new Date(Date.now() + timeMinutes * 60 * 1000),
    };
  }

  optimizeRoute(waypoints: Array<{ lat: number; lng: number }>) {
    if (waypoints.length <= 2) {
      return waypoints;
    }

    const optimized = [waypoints[0]];
    const remaining = waypoints.slice(1, -1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearest = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          current.lat,
          current.lng,
          remaining[i].lat,
          remaining[i].lng,
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      }

      optimized.push(remaining[nearest]);
      remaining.splice(nearest, 1);
    }

    optimized.push(waypoints[waypoints.length - 1]);
    return optimized;
  }

  getDriverLocation(tenantId: number, driverId: number) {
    const key = `${tenantId}-${driverId}`;
    return this.driverLocations.get(key) || null;
  }

  getAllDriverLocations(tenantId: number) {
    const locations: LocationData[] = [];
    for (const [key, location] of this.driverLocations.entries()) {
      if (key.startsWith(`${tenantId}-`)) {
        locations.push(location);
      }
    }
    return locations;
  }

  createGeofence(tenantId: number, geofence: GeofenceData) {
    if (!this.geofences.has(tenantId)) {
      this.geofences.set(tenantId, []);
    }
    this.geofences.get(tenantId).push(geofence);
    return { success: true, geofence_id: geofence.id };
  }

  getGeofences(tenantId: number) {
    return this.geofences.get(tenantId) || [];
  }

  calculateRouteDistance(waypoints: Array<{ lat: number; lng: number }>) {
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.calculateDistance(
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng,
      );
    }
    return Math.round(totalDistance * 100) / 100;
  }

  generateRouteSnapshot(tripId: number, driverId: number, tenantId: number, waypoints: any[]) {
    const distance = this.calculateRouteDistance(waypoints);
    const duration = Math.round((distance / 40) * 60);

    return {
      trip_id: tripId,
      driver_id: driverId,
      tenant_id: tenantId,
      start_latitude: waypoints[0].lat,
      start_longitude: waypoints[0].lng,
      end_latitude: waypoints[waypoints.length - 1].lat,
      end_longitude: waypoints[waypoints.length - 1].lng,
      distance_km: distance,
      estimated_duration_minutes: duration,
      waypoints: waypoints,
      timestamp: new Date(),
    };
  }
}
