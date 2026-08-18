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

type TrackingMode = 'active' | 'assigned' | 'idle' | 'off';

interface GpsStore {
  currentLocation: LocationData | null;
  isTracking: boolean;
  trackingMode: TrackingMode;
  trackingHistory: LocationData[];
  lastError: string | null;

  setCurrentLocation: (location: LocationData | null) => void;
  setIsTracking: (tracking: boolean) => void;
  setTrackingMode: (mode: TrackingMode) => void;
  addToHistory: (location: LocationData) => void;
  setLastError: (error: string | null) => void;

  startTracking: (mode?: TrackingMode) => Promise<void>;
  stopTracking: () => void;
  setTripStatus: (status: 'in_progress' | 'assigned' | 'completed' | 'idle') => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  saveTrackingHistory: () => Promise<void>;
  loadTrackingHistory: () => Promise<void>;
  clearHistory: () => void;
}

let locationSubscription: Location.LocationSubscription | null = null;

export const useGpsStore = create<GpsStore>((set, get) => ({
  currentLocation: null,
  isTracking: false,
  trackingMode: 'off',
  trackingHistory: [],
  lastError: null,

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setIsTracking: (tracking) => set({ isTracking: tracking }),
  setTrackingMode: (mode) => set({ trackingMode: mode }),
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

  startTracking: async (mode: TrackingMode = 'active') => {
    try {
      const hasPermission = await get().requestLocationPermission();
      if (!hasPermission) return;

      set({ isTracking: true, trackingMode: mode, lastError: null });

      if (locationSubscription) {
        locationSubscription.remove();
      }

      // Adaptive GPS settings based on tracking mode
      const trackingConfig = {
        active: {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        assigned: {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 50, // 50 meters
        },
        idle: {
          accuracy: Location.Accuracy.Low,
          timeInterval: 120000, // 2 minutes
          distanceInterval: 200, // 200 meters
        },
        off: null,
      };

      const config = trackingConfig[mode];
      if (!config) {
        set({ isTracking: false });
        return;
      }

      locationSubscription = await Location.watchPositionAsync(config, (location) => {
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
    set({ isTracking: false, trackingMode: 'off' });
  },

  setTripStatus: async (status: 'in_progress' | 'assigned' | 'completed' | 'idle') => {
    // Adaptive GPS tracking based on trip status
    // Reduces battery drain by using lower accuracy and longer intervals when not actively delivering
    switch (status) {
      case 'in_progress':
        // Active delivery: high accuracy, 5-second intervals
        await get().startTracking('active');
        break;
      case 'assigned':
        // Waiting for pickup: balanced accuracy, 30-second intervals
        await get().startTracking('assigned');
        break;
      case 'completed':
      case 'idle':
        // Not on trip: stop GPS completely or low-frequency polling
        get().stopTracking();
        break;
    }
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
