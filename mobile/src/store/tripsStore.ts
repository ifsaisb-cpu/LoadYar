import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Trip {
  id: number;
  trip_number: string;
  driver_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_location: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  cargo_description: string;
  cargo_weight: number;
  rate: number;
  status: 'pending' | 'assigned' | 'pickedup' | 'in_transit' | 'delivered' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

interface TripsStore {
  activeTrips: Trip[];
  selectedTrip: Trip | null;
  isLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error';

  setActiveTrips: (trips: Trip[]) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setIsLoading: (loading: boolean) => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'pending' | 'error') => void;

  fetchActiveTrips: (driverId: number) => Promise<void>;
  updateTripStatus: (tripId: number, status: string) => Promise<void>;
  saveToOfflineStorage: () => Promise<void>;
  loadFromOfflineStorage: () => Promise<void>;
}

export const useTripsStore = create<TripsStore>((set, get) => ({
  activeTrips: [],
  selectedTrip: null,
  isLoading: false,
  syncStatus: 'synced',

  setActiveTrips: (trips) => set({ activeTrips: trips }),
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSyncStatus: (status) => set({ syncStatus: status }),

  fetchActiveTrips: async (driverId: number) => {
    set({ isLoading: true, syncStatus: 'syncing' });
    try {
      // Mock data - in production would call backend API
      const mockTrips: Trip[] = [
        {
          id: 1,
          trip_number: 'TRIP-001-2026',
          driver_id: driverId,
          customer_name: 'Ali Corporation',
          customer_phone: '+92 300 1111111',
          pickup_location: 'Central Warehouse',
          pickup_address: 'Lahore, Punjab',
          pickup_lat: 31.5204,
          pickup_lng: 74.3587,
          delivery_location: 'Downtown Office',
          delivery_address: 'Karachi, Sindh',
          delivery_lat: 24.8607,
          delivery_lng: 67.0011,
          cargo_description: 'Electronics & Components',
          cargo_weight: 250,
          rate: 5000,
          status: 'assigned',
          priority: 'high',
          special_instructions: 'Handle with care - fragile items',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          trip_number: 'TRIP-002-2026',
          driver_id: driverId,
          customer_name: 'Blue Industries',
          customer_phone: '+92 321 2222222',
          pickup_location: 'Port Authority',
          pickup_address: 'Port Qasim, Karachi',
          pickup_lat: 24.7844,
          pickup_lng: 67.2667,
          delivery_location: 'Industrial Zone',
          delivery_address: 'Islamabad, ICT',
          delivery_lat: 33.6844,
          delivery_lng: 73.0479,
          cargo_description: 'Raw Materials',
          cargo_weight: 500,
          rate: 8000,
          status: 'pending',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      set({ activeTrips: mockTrips, syncStatus: 'synced' });
      await get().saveToOfflineStorage();
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      set({ syncStatus: 'error' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTripStatus: async (tripId: number, status: string) => {
    set({ syncStatus: 'syncing' });
    try {
      const trips = get().activeTrips.map((trip) =>
        trip.id === tripId ? { ...trip, status: status as Trip['status'] } : trip
      );
      set({ activeTrips: trips, syncStatus: 'synced' });
      await get().saveToOfflineStorage();
    } catch (error) {
      console.error('Failed to update trip status:', error);
      set({ syncStatus: 'error' });
    }
  },

  saveToOfflineStorage: async () => {
    try {
      const { activeTrips, selectedTrip } = get();
      await AsyncStorage.setItem('activeTrips', JSON.stringify(activeTrips));
      if (selectedTrip) {
        await AsyncStorage.setItem('selectedTrip', JSON.stringify(selectedTrip));
      }
    } catch (error) {
      console.error('Failed to save trips to storage:', error);
    }
  },

  loadFromOfflineStorage: async () => {
    try {
      const tripsJson = await AsyncStorage.getItem('activeTrips');
      const selectedTripJson = await AsyncStorage.getItem('selectedTrip');

      if (tripsJson) {
        set({ activeTrips: JSON.parse(tripsJson) });
      }
      if (selectedTripJson) {
        set({ selectedTrip: JSON.parse(selectedTripJson) });
      }
    } catch (error) {
      console.error('Failed to load trips from storage:', error);
    }
  },
}));
