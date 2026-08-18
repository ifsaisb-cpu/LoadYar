import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';

export interface DriverLocation {
  driver_id: number;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
  trip_id?: number;
  status: 'active' | 'idle' | 'offline';
}

export interface Geofence {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  delivery_zone_type: string;
  created_at: Date;
}

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  sequence: number;
  timestamp: Date;
  address?: string;
}

interface UseGpsTrackingReturn {
  drivers: DriverLocation[];
  geofences: Geofence[];
  selectedDriver: DriverLocation | null;
  routeWaypoints: RouteWaypoint[];
  loading: boolean;
  error: string | null;
  selectDriver: (driver: DriverLocation) => void;
  getDriverRoute: (driverId: number, tripId?: number) => Promise<RouteWaypoint[]>;
  refetchLocations: () => Promise<void>;
}

export const useGpsTracking = (tenantId: number): UseGpsTrackingReturn => {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<RouteWaypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/gps/locations/live', {
        params: { tenant_id: tenantId },
      });
      setDrivers(
        response.data.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        })),
      );
    } catch (err) {
      setError('Failed to fetch driver locations');
      console.error('GPS fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const fetchGeofences = useCallback(async () => {
    try {
      const response = await apiClient.get('/gps/geofences', {
        params: { tenant_id: tenantId },
      });
      setGeofences(response.data);
    } catch (err) {
      console.error('Geofence fetch error:', err);
    }
  }, [tenantId]);

  const getDriverRoute = useCallback(
    async (driverId: number, tripId?: number): Promise<RouteWaypoint[]> => {
      try {
        const params: any = { tenant_id: tenantId, driver_id: driverId };
        if (tripId) params.trip_id = tripId;

        const response = await apiClient.get('/gps/route', { params });
        const waypoints = response.data.waypoints.map((w: any) => ({
          ...w,
          timestamp: new Date(w.timestamp),
        }));
        setRouteWaypoints(waypoints);
        return waypoints;
      } catch (err) {
        console.error('Route fetch error:', err);
        return [];
      }
    },
    [tenantId],
  );

  useEffect(() => {
    fetchLocations();
    fetchGeofences();

    // Refresh locations every 5 seconds
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, [fetchLocations, fetchGeofences]);

  const selectDriver = useCallback((driver: DriverLocation) => {
    setSelectedDriver(driver);
    if (driver.trip_id) {
      getDriverRoute(driver.driver_id, driver.trip_id);
    }
  }, [getDriverRoute]);

  return {
    drivers,
    geofences,
    selectedDriver,
    routeWaypoints,
    loading,
    error,
    selectDriver,
    getDriverRoute,
    refetchLocations: fetchLocations,
  };
};
