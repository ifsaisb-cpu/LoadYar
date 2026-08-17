import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface Trip {
  id: number;
  bilty_no: string;
  customer_id: number;
  date: string;
  status: 'booked' | 'in_transit' | 'delivered' | 'closed';
  freight_paisa: number;
  consignee: string;
  carrier_id?: number;
  driver_id?: number;
  route?: string;
  created_at: string;
}

interface TripsState {
  // State
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    status?: string;
    customerId?: number;
  };

  // Actions
  fetchTrips: () => Promise<void>;
  fetchTripsByStatus: (status: string) => Promise<void>;
  fetchTripById: (id: number) => Promise<void>;
  createTrip: (trip: Partial<Trip>) => Promise<Trip>;
  updateTrip: (id: number, updates: Partial<Trip>) => Promise<void>;
  updateTripStatus: (id: number, status: string) => Promise<void>;
  setFilter: (filter: any) => void;
  clearError: () => void;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
  filter: {},

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/trips');
      set({ trips: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch trips';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTripsByStatus: async (status: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/status/${status}`);
      set({
        trips: response.data,
        filter: { status },
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch trips';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTripById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/${id}`);
      set({ currentTrip: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch trip';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createTrip: async (trip: Partial<Trip>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/trips', trip);
      const newTrip = response.data;
      set((state) => ({
        trips: [newTrip, ...state.trips],
        isLoading: false,
      }));
      return newTrip;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create trip';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateTrip: async (id: number, updates: Partial<Trip>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.patch(`/trips/${id}`, updates);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? response.data : t)),
        currentTrip: state.currentTrip?.id === id ? response.data : state.currentTrip,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update trip';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateTripStatus: async (id: number, status: string) => {
    await get().updateTrip(id, { status: status as any });
  },

  setFilter: (filter: any) => {
    set({ filter });
  },

  clearError: () => set({ error: null }),
}));
