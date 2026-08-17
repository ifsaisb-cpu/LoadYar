import { create } from 'zustand';
import { locationService, LocationCoordinates } from '../services/location';
import { storageService } from '../services/storage';

interface LocationState {
  // State
  currentLocation: LocationCoordinates | null;
  tripLocations: LocationCoordinates[];
  isTracking: boolean;
  isLoadingPermission: boolean;
  error: string | null;
  trackingStartTime: number | null;
  distanceTraveled: number;

  // Actions
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  startTracking: (tripId: number) => Promise<void>;
  stopTracking: (tripId: number) => Promise<void>;
  saveLocationToTrip: (tripId: number, location: LocationCoordinates) => Promise<void>;
  clearTripLocations: () => void;
  calculateTotalDistance: () => number;
  clearError: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  tripLocations: [],
  isTracking: false,
  isLoadingPermission: false,
  error: null,
  trackingStartTime: null,
  distanceTraveled: 0,

  requestLocationPermission: async () => {
    set({ isLoadingPermission: true });
    try {
      const hasPermission = await locationService.requestPermissions();
      set({ isLoadingPermission: false });
      return hasPermission;
    } catch (error: any) {
      set({
        error: 'Failed to request location permission',
        isLoadingPermission: false,
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        set({ currentLocation: location, error: null });
      } else {
        set({ error: 'Unable to get current location' });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  startTracking: async (tripId: number) => {
    set({ isTracking: true, trackingStartTime: Date.now(), error: null });

    try {
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Save tracking start to storage
      await storageService.setItem(`tracking_${tripId}`, {
        startTime: Date.now(),
        status: 'active',
      });

      // Start foreground tracking (10 second intervals for accuracy)
      locationService.startForegroundTracking((location) => {
        set((state) => {
          const prevLocation = state.currentLocation;
          let distance = state.distanceTraveled;

          // Calculate distance from previous location
          if (prevLocation) {
            const newDistance = locationService.calculateDistance(
              prevLocation.latitude,
              prevLocation.longitude,
              location.latitude,
              location.longitude
            );
            distance += newDistance;
          }

          return {
            currentLocation: location,
            tripLocations: [...state.tripLocations, location],
            distanceTraveled: distance,
          };
        });
      }, 10000);

      // Also start background tracking for when app goes to background (60 second intervals)
      await locationService.startBackgroundTracking(() => {}, 60000);
    } catch (error: any) {
      set({
        isTracking: false,
        error: error.message,
      });
    }
  },

  stopTracking: async (tripId: number) => {
    try {
      // Stop both foreground and background tracking
      await locationService.stopForegroundTracking();
      await locationService.stopBackgroundTracking();

      // Update tracking record in storage
      await storageService.setItem(`tracking_${tripId}`, {
        startTime: get().trackingStartTime,
        endTime: Date.now(),
        status: 'completed',
        distanceTraveled: get().distanceTraveled,
        locationCount: get().tripLocations.length,
      });

      set({ isTracking: false });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  saveLocationToTrip: async (tripId: number, location: LocationCoordinates) => {
    try {
      const tripLocations = await storageService.getItem(`trip_locations_${tripId}`);
      const locations = tripLocations || [];
      locations.push(location);

      await storageService.setItem(`trip_locations_${tripId}`, locations);

      set((state) => ({
        tripLocations: [...state.tripLocations, location],
      }));
    } catch (error: any) {
      set({ error: 'Failed to save location' });
    }
  },

  clearTripLocations: () => {
    set({ tripLocations: [], distanceTraveled: 0, currentLocation: null });
  },

  calculateTotalDistance: () => {
    const state = get();
    let total = 0;

    for (let i = 0; i < state.tripLocations.length - 1; i++) {
      const current = state.tripLocations[i];
      const next = state.tripLocations[i + 1];

      const distance = locationService.calculateDistance(
        current.latitude,
        current.longitude,
        next.latitude,
        next.longitude
      );

      total += distance;
    }

    return total;
  },

  clearError: () => set({ error: null }),
}));
