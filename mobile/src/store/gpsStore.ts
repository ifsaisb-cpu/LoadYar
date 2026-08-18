import { create } from 'zustand';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: number;
}

interface GpsStore {
  currentLocation: LocationData | null;
  isTracking: boolean;
  trackingHistory: LocationData[];
  lastError: string | null;

  setCurrentLocation: (location: LocationData | null) => void;
  setIsTracking: (tracking: boolean) => void;
  addToHistory: (location: LocationData) => void;
  setLastError: (error: string | null) => void;

  startTracking: () => Promise<void>;
  stopTracking: () => void;
  requestLocationPermission: () => Promise<boolean>;
  saveTrackingHistory: () => Promise<void>;
  loadTrackingHistory: () => Promise<void>;
  clearHistory: () => void;
}

let locationSubscription: Location.LocationSubscription | null = null;

export const useGpsStore = create<GpsStore>((set, get) => ({
  currentLocation: null,
  isTracking: false,
  trackingHistory: [],
  lastError: null,

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setIsTracking: (tracking) => set({ isTracking: tracking }),
  addToHistory: (location) => {
    const history = get().trackingHistory;
    const newHistory = [...history, location];
    // Keep last 1000 points to avoid memory issues
    if (newHistory.length > 1000) {
      newHistory.shift();
    }
    set({ trackingHistory: newHistory });
  },
  setLastError: (error) => set({ lastError: error }),

  requestLocationPermission: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ lastError: 'Location permission denied' });
        return false;
      }
      set({ lastError: null });
      return true;
    } catch (error) {
      set({ lastError: 'Failed to request location permission' });
      return false;
    }
  },

  startTracking: async () => {
    try {
      const hasPermission = await get().requestLocationPermission();
      if (!hasPermission) return;

      set({ isTracking: true, lastError: null });

      // High accuracy location updates every 5 seconds
      if (locationSubscription) {
        locationSubscription.remove();
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || 0,
            accuracy: location.coords.accuracy || 0,
            speed: location.coords.speed || 0,
            heading: location.coords.heading || 0,
            timestamp: location.timestamp,
          };

          set({ currentLocation: locationData });
          get().addToHistory(locationData);
        },
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ isTracking: false, lastError: errorMessage });
    }
  },

  stopTracking: () => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    set({ isTracking: false });
  },

  saveTrackingHistory: async () => {
    try {
      const history = get().trackingHistory;
      await AsyncStorage.setItem('trackingHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save tracking history:', error);
    }
  },

  loadTrackingHistory: async () => {
    try {
      const historyJson = await AsyncStorage.getItem('trackingHistory');
      if (historyJson) {
        set({ trackingHistory: JSON.parse(historyJson) });
      }
    } catch (error) {
      console.error('Failed to load tracking history:', error);
    }
  },

  clearHistory: () => {
    set({ trackingHistory: [] });
    AsyncStorage.removeItem('trackingHistory').catch(console.error);
  },
}));
