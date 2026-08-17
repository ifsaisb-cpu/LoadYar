import { create } from 'zustand';
import { storageService } from '../services/storage';
import { apiClient } from '../services/api';

export interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  tenant_id: number;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
}

interface AuthState {
  // State
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  availableTenants: Tenant[];

  // Actions
  login: (username: string, password: string, tenantId?: number) => Promise<void>;
  selectTenant: (tenantId: number) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  token: null,
  isLoading: false,
  error: null,
  availableTenants: [],

  login: async (username: string, password: string, tenantId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
        tenant_id: tenantId,
      });

      const { access_token, user, tenant } = response.data;

      // Save to storage
      await storageService.setAuthToken(access_token);
      await storageService.setUserContext(user, tenant);

      set({
        token: access_token,
        user,
        tenant,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  selectTenant: async (tenantId: number) => {
    set({ isLoading: true });
    try {
      // Re-login with selected tenant
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.username) {
        throw new Error('No user context');
      }

      // Get tenants and filter
      const response = await apiClient.get('/auth/tenants');
      const tenants = response.data;
      const selectedTenant = tenants.find((t: Tenant) => t.id === tenantId);

      if (!selectedTenant) {
        throw new Error('Tenant not found');
      }

      // Update context
      await storageService.setUserContext(currentUser, selectedTenant);

      set({
        tenant: selectedTenant,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear storage
      await storageService.clearAuthToken();
      await storageService.clearUserContext();
      await storageService.clearSyncQueue();

      set({
        user: null,
        tenant: null,
        token: null,
        availableTenants: [],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await storageService.getAuthToken();
      const context = await storageService.getUserContext();

      if (token && context) {
        set({
          token,
          user: context.user,
          tenant: context.tenant,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      console.error('Session restore error:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
