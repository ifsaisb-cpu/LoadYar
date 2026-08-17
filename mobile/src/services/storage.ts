import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline-first storage service using AsyncStorage for key-value pairs
 * In production, use SQLite for relational data via expo-sqlite
 */

export interface StorageService {
  // Auth
  setAuthToken: (token: string) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  clearAuthToken: () => Promise<void>;

  // User context
  setUserContext: (user: any, tenant: any) => Promise<void>;
  getUserContext: () => Promise<{ user: any; tenant: any } | null>;
  clearUserContext: () => Promise<void>;

  // Sync queue
  addToSyncQueue: (operation: any) => Promise<void>;
  getSyncQueue: () => Promise<any[]>;
  removeSyncQueueItem: (id: string) => Promise<void>;
  clearSyncQueue: () => Promise<void>;

  // Generic key-value
  setItem: (key: string, value: any) => Promise<void>;
  getItem: (key: string) => Promise<any>;
  removeItem: (key: string) => Promise<void>;
}

class LocalStorageService implements StorageService {
  private readonly authTokenKey = 'auth_token';
  private readonly userContextKey = 'user_context';
  private readonly syncQueueKey = 'sync_queue';

  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(this.authTokenKey, token);
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem(this.authTokenKey);
  }

  async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(this.authTokenKey);
  }

  async setUserContext(user: any, tenant: any): Promise<void> {
    const context = { user, tenant };
    await AsyncStorage.setItem(this.userContextKey, JSON.stringify(context));
  }

  async getUserContext(): Promise<{ user: any; tenant: any } | null> {
    const data = await AsyncStorage.getItem(this.userContextKey);
    return data ? JSON.parse(data) : null;
  }

  async clearUserContext(): Promise<void> {
    await AsyncStorage.removeItem(this.userContextKey);
  }

  async addToSyncQueue(operation: any): Promise<void> {
    const queue = await this.getSyncQueue();
    operation.id = `${Date.now()}-${Math.random()}`;
    operation.createdAt = new Date().toISOString();
    operation.status = 'pending'; // pending, syncing, synced, failed
    queue.push(operation);
    await AsyncStorage.setItem(this.syncQueueKey, JSON.stringify(queue));
  }

  async getSyncQueue(): Promise<any[]> {
    const data = await AsyncStorage.getItem(this.syncQueueKey);
    return data ? JSON.parse(data) : [];
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(this.syncQueueKey, JSON.stringify(filtered));
  }

  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.syncQueueKey);
  }

  async setItem(key: string, value: any): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  }

  async getItem(key: string): Promise<any> {
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const storageService = new LocalStorageService();
