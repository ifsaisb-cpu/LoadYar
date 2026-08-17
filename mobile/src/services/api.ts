import axios, { AxiosInstance, AxiosError } from 'axios';
import { storageService } from './storage';
import NetInfo from '@react-native-community/netinfo';

export interface APIResponse<T> {
  data: T;
  status: number;
  isCached: boolean;
}

export interface SyncOperation {
  id?: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: any;
  status?: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt?: string;
  retries?: number;
}

class APIClient {
  private api: AxiosInstance;
  private baseURL: string;
  private isOnline: boolean = true;

  constructor(baseURL: string = 'http://localhost:3001/api/v1') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 10000,
    });

    // Add token to requests
    this.api.interceptors.request.use(async (config) => {
      const token = await storageService.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.initNetworkMonitoring();
  }

  private async initNetworkMonitoring(): Promise<void> {
    // Monitor network connectivity (requires @react-native-community/netinfo)
    // For now, simple fallback
  }

  /**
   * GET request - cached if offline
   */
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    const cacheKey = `cache:${endpoint}`;

    try {
      const response = await this.api.get<T>(endpoint);
      // Cache successful response
      await storageService.setItem(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
      return {
        data: response.data,
        status: response.status,
        isCached: false,
      };
    } catch (error) {
      // Offline: try cache
      if (!this.isOnline) {
        const cached = await storageService.getItem(cacheKey);
        if (cached?.data) {
          return {
            data: cached.data,
            status: 200,
            isCached: true,
          };
        }
      }
      throw error;
    }
  }

  /**
   * POST request - queued if offline
   */
  async post<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    try {
      const response = await this.api.post<T>(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        isCached: false,
      };
    } catch (error) {
      // Offline: queue for sync
      if (!this.isOnline) {
        await storageService.addToSyncQueue({
          method: 'POST',
          endpoint,
          data,
        });
        return {
          data: { id: `pending-${Date.now()}` } as T,
          status: 202, // Accepted
          isCached: false,
        };
      }
      throw error;
    }
  }

  /**
   * PATCH request - queued if offline
   */
  async patch<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    try {
      const response = await this.api.patch<T>(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        isCached: false,
      };
    } catch (error) {
      if (!this.isOnline) {
        await storageService.addToSyncQueue({
          method: 'PATCH',
          endpoint,
          data,
        });
        return {
          data: { id: `pending-${Date.now()}` } as T,
          status: 202,
          isCached: false,
        };
      }
      throw error;
    }
  }

  /**
   * DELETE request - queued if offline
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    try {
      const response = await this.api.delete<T>(endpoint);
      return {
        data: response.data,
        status: response.status,
        isCached: false,
      };
    } catch (error) {
      if (!this.isOnline) {
        await storageService.addToSyncQueue({
          method: 'DELETE',
          endpoint,
        });
        return {
          data: {} as T,
          status: 202,
          isCached: false,
        };
      }
      throw error;
    }
  }

  /**
   * Sync queued operations when back online
   */
  async syncQueue(): Promise<void> {
    const queue = await storageService.getSyncQueue();

    for (const operation of queue) {
      try {
        let response;
        const { method, endpoint, data, id } = operation;

        switch (method) {
          case 'POST':
            response = await this.api.post(endpoint, data);
            break;
          case 'PATCH':
            response = await this.api.patch(endpoint, data);
            break;
          case 'DELETE':
            response = await this.api.delete(endpoint);
            break;
          default:
            continue;
        }

        // Remove synced item
        await storageService.removeSyncQueueItem(id);
      } catch (error) {
        // Mark for retry later
        console.error(`Sync failed for operation: ${operation.id}`, error);
        operation.retries = (operation.retries || 0) + 1;
        if (operation.retries > 3) {
          // Remove after 3 retries
          await storageService.removeSyncQueueItem(operation.id);
        }
      }
    }
  }

  setOnline(online: boolean): void {
    this.isOnline = online;
    if (online) {
      // Auto-sync when coming online
      this.syncQueue().catch(console.error);
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const apiClient = new APIClient(
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
);
