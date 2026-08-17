import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

class LocationService {
  private foregroundSubscription: Location.LocationSubscription | null = null;
  private backgroundSubscription: Location.LocationSubscription | null = null;
  private watchId: number | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status !== 'granted') {
        return false;
      }

      const background = await Location.requestBackgroundPermissionsAsync();
      return background.status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Get current location error:', error);
      return null;
    }
  }

  async startForegroundTracking(
    callback: (location: LocationCoordinates) => void,
    intervalMs: number = 10000 // Default 10 seconds
  ): Promise<void> {
    try {
      // Stop any existing subscriptions
      await this.stopForegroundTracking();

      // Set location accuracy and monitoring
      await Location.setActivityTypeAsync(Location.ActivityType.OtherNavigation);

      // Watch location with timeout
      this.foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: intervalMs,
          distanceInterval: 10, // Update if moved 10m
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          });
        }
      );
    } catch (error) {
      console.error('Start foreground tracking error:', error);
    }
  }

  async stopForegroundTracking(): Promise<void> {
    if (this.foregroundSubscription) {
      await this.foregroundSubscription.remove();
      this.foregroundSubscription = null;
    }
  }

  async startBackgroundTracking(
    callback: (location: LocationCoordinates) => void,
    intervalMs: number = 60000 // Default 60 seconds for battery efficiency
  ): Promise<void> {
    try {
      await this.stopBackgroundTracking();

      // Define background location tasks
      await Location.startLocationUpdatesAsync('LOCATION_TRACKING', {
        accuracy: Location.Accuracy.High,
        timeInterval: intervalMs,
        distanceInterval: 10,
        foregroundService: {
          notificationBody: 'LoadYar is tracking your location',
          notificationTitle: 'Trip in Progress',
          notificationColor: '#0066cc',
        },
      });

      console.log('Background location tracking started');
    } catch (error) {
      console.error('Start background tracking error:', error);
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      const isRegistered = await Location.hasStartedLocationUpdatesAsync('LOCATION_TRACKING');
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync('LOCATION_TRACKING');
      }
    } catch (error) {
      console.error('Stop background tracking error:', error);
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula for distance calculation (in kilometers)
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  async geocodeAddress(latitude: number, longitude: number): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const { street, city, region } = results[0];
        return [street, city, region].filter(Boolean).join(', ');
      }
      return null;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();
