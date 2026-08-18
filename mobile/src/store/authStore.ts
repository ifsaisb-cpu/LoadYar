import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  tenant_id: number;
  vehicle_id?: number;
  rating: number;
  status: 'active' | 'idle' | 'offline';
}

interface AuthStore {
  driver: Driver | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setDriver: (driver: Driver | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  driver: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setDriver: (driver) => set({ driver, isAuthenticated: !!driver }),
  setToken: (token) => set({ token }),
  setIsLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('driver');
    set({ driver: null, token: null, isAuthenticated: false });
  },

  login: async (email: string, password: string) => {
    // Mock login - in production would call backend API
    set({ isLoading: true });
    try {
      // Simulate API call
      const mockDriver: Driver = {
        id: 1,
        name: 'Ahmed Khan',
        email,
        phone: '+92 300 1234567',
        tenant_id: 1,
        vehicle_id: 101,
        rating: 4.8,
        status: 'active',
      };

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token';

      await AsyncStorage.setItem('authToken', mockToken);
      await AsyncStorage.setItem('driver', JSON.stringify(mockDriver));

      set({ driver: mockDriver, token: mockToken, isAuthenticated: true });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const driverJson = await AsyncStorage.getItem('driver');

      if (token && driverJson) {
        const driver = JSON.parse(driverJson);
        set({ token, driver, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
