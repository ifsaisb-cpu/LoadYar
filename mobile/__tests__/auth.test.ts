import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../src/store/auth';
import { storageService } from '../src/services/storage';
import { apiClient } from '../src/services/api';

// Mock dependencies
jest.mock('../src/services/storage');
jest.mock('../src/services/api');

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          user: { id: 1, name: 'Test User', username: 'testuser', role: 'driver', tenant_id: 1 },
          tenant: { id: 1, name: 'Test Tenant', slug: 'test' },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);
      (storageService.setAuthToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setUserContext as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(result.current.tenant).toEqual(mockResponse.data.tenant);
      expect(result.current.token).toBe('mock-token');
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed login', async () => {
      const mockError = {
        response: { data: { message: 'Invalid credentials' } },
      };

      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      try {
        await act(async () => {
          await result.current.login('testuser', 'wrongpassword');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBeNull();
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isLoading).toBe(false);

      const loginPromise = act(async () => {
        (apiClient.post as jest.Mock).mockResolvedValue({
          data: {
            access_token: 'token',
            user: { id: 1, name: 'Test', username: 'test', role: 'driver', tenant_id: 1 },
            tenant: { id: 1, name: 'Test', slug: 'test' },
          },
        });
        return result.current.login('test', 'pass');
      });

      await loginPromise;
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear auth state on logout', async () => {
      (storageService.clearAuthToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.clearUserContext as jest.Mock).mockResolvedValue(undefined);
      (storageService.clearSyncQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        useAuthStore.setState({
          user: { id: 1, name: 'Test', username: 'test', role: 'driver', tenant_id: 1 },
          tenant: { id: 1, name: 'Test', slug: 'test' },
          token: 'mock-token',
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tenant).toBeNull();
      expect(result.current.token).toBeNull();
      expect(storageService.clearAuthToken).toHaveBeenCalled();
      expect(storageService.clearUserContext).toHaveBeenCalled();
    });
  });

  describe('restoreSession', () => {
    it('should restore session from storage', async () => {
      const mockToken = 'restored-token';
      const mockContext = {
        user: { id: 1, name: 'Test', username: 'test', role: 'driver', tenant_id: 1 },
        tenant: { id: 1, name: 'Test', slug: 'test' },
      };

      (storageService.getAuthToken as jest.Mock).mockResolvedValue(mockToken);
      (storageService.getUserContext as jest.Mock).mockResolvedValue(mockContext);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.restoreSession();
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.user).toEqual(mockContext.user);
      expect(result.current.tenant).toEqual(mockContext.tenant);
    });

    it('should handle empty session', async () => {
      (storageService.getAuthToken as jest.Mock).mockResolvedValue(null);
      (storageService.getUserContext as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.restoreSession();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('selectTenant', () => {
    it('should select a different tenant', async () => {
      const mockTenants = [
        { id: 1, name: 'Tenant 1', slug: 'tenant-1' },
        { id: 2, name: 'Tenant 2', slug: 'tenant-2' },
      ];
      const mockUser = { id: 1, name: 'Test', username: 'test', role: 'driver', tenant_id: 1 };

      (apiClient.get as jest.Mock).mockResolvedValue(mockTenants);
      (storageService.setUserContext as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set initial user
      act(() => {
        useAuthStore.setState({ user: mockUser });
      });

      await act(async () => {
        await result.current.selectTenant(2);
      });

      expect(result.current.tenant?.id).toBe(2);
      expect(result.current.tenant?.name).toBe('Tenant 2');
    });

    it('should error if tenant not found', async () => {
      const mockTenants = [{ id: 1, name: 'Tenant 1', slug: 'tenant-1' }];
      const mockUser = { id: 1, name: 'Test', username: 'test', role: 'driver', tenant_id: 1 };

      (apiClient.get as jest.Mock).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ user: mockUser });
      });

      try {
        await act(async () => {
          await result.current.selectTenant(999);
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.error).toBe('Tenant not found');
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
