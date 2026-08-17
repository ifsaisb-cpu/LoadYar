import { renderHook, act } from '@testing-library/react-native';
import { useTripsStore } from '../src/store/trips';
import { apiClient } from '../src/services/api';

jest.mock('../src/services/api');

describe('Trips Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTrips = [
    {
      id: 1,
      bilty_no: 'BL-001',
      customer_id: 1,
      date: '2026-08-17',
      status: 'booked' as const,
      freight_paisa: 50000,
      consignee: 'Ali Khan',
      carrier_id: 1,
      driver_id: 1,
      route: 'ISB-LHR',
      created_at: '2026-08-17T10:00:00Z',
    },
    {
      id: 2,
      bilty_no: 'BL-002',
      customer_id: 2,
      date: '2026-08-17',
      status: 'in_transit' as const,
      freight_paisa: 75000,
      consignee: 'Ahmed Hassan',
      carrier_id: 2,
      driver_id: 2,
      route: 'LHR-KHI',
      created_at: '2026-08-17T11:00:00Z',
    },
  ];

  describe('fetchTrips', () => {
    it('should fetch all trips', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockTrips,
        status: 200,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      await act(async () => {
        await result.current.fetchTrips();
      });

      expect(result.current.trips).toEqual(mockTrips);
      expect(result.current.isLoading).toBe(false);
      expect(apiClient.get).toHaveBeenCalledWith('/trips');
    });

    it('should set loading state while fetching', async () => {
      (apiClient.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: mockTrips,
                  status: 200,
                  isCached: false,
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useTripsStore());

      const fetchPromise = act(async () => {
        await result.current.fetchTrips();
      });

      expect(result.current.isLoading).toBe(true);
      await fetchPromise;
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useTripsStore());

      await act(async () => {
        await result.current.fetchTrips();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.trips).toEqual([]);
    });
  });

  describe('fetchTripsByStatus', () => {
    it('should fetch trips by status', async () => {
      const bookedTrips = mockTrips.filter((t) => t.status === 'booked');
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: bookedTrips,
        status: 200,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      await act(async () => {
        await result.current.fetchTripsByStatus('booked');
      });

      expect(result.current.trips).toEqual(bookedTrips);
      expect(result.current.filter.status).toBe('booked');
      expect(apiClient.get).toHaveBeenCalledWith('/trips/status/booked');
    });
  });

  describe('fetchTripById', () => {
    it('should fetch single trip by ID', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockTrips[0],
        status: 200,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      await act(async () => {
        await result.current.fetchTripById(1);
      });

      expect(result.current.currentTrip).toEqual(mockTrips[0]);
      expect(apiClient.get).toHaveBeenCalledWith('/trips/1');
    });
  });

  describe('createTrip', () => {
    it('should create new trip', async () => {
      const newTrip = {
        bilty_no: 'BL-003',
        customer_id: 3,
        date: '2026-08-18',
        status: 'booked' as const,
        freight_paisa: 100000,
        consignee: 'New Customer',
      };

      const createdTrip = { id: 3, ...newTrip, created_at: '2026-08-18T10:00:00Z' };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: createdTrip,
        status: 201,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      act(() => {
        useTripsStore.setState({ trips: mockTrips });
      });

      let returnedTrip;
      await act(async () => {
        returnedTrip = await result.current.createTrip(newTrip);
      });

      expect(returnedTrip).toEqual(createdTrip);
      expect(result.current.trips[0].id).toBe(3);
    });

    it('should throw error on create failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useTripsStore());

      try {
        await act(async () => {
          await result.current.createTrip({});
        });
      } catch (error: any) {
        expect(error.message).toBe('Create failed');
      }

      expect(result.current.error).toBe('Create failed');
    });
  });

  describe('updateTrip', () => {
    it('should update trip', async () => {
      const updatedTrip = { ...mockTrips[0], status: 'in_transit' as const };

      (apiClient.patch as jest.Mock).mockResolvedValue({
        data: updatedTrip,
        status: 200,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      act(() => {
        useTripsStore.setState({ trips: mockTrips });
      });

      await act(async () => {
        await result.current.updateTrip(1, { status: 'in_transit' });
      });

      expect(result.current.trips[0].status).toBe('in_transit');
      expect(apiClient.patch).toHaveBeenCalledWith('/trips/1', { status: 'in_transit' });
    });

    it('should update currentTrip when viewing details', async () => {
      const updatedTrip = { ...mockTrips[0], status: 'delivered' as const };

      (apiClient.patch as jest.Mock).mockResolvedValue({
        data: updatedTrip,
        status: 200,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      act(() => {
        useTripsStore.setState({ currentTrip: mockTrips[0] });
      });

      await act(async () => {
        await result.current.updateTrip(1, { status: 'delivered' });
      });

      expect(result.current.currentTrip?.status).toBe('delivered');
    });

    it('should handle update error', async () => {
      (apiClient.patch as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTripsStore());

      try {
        await act(async () => {
          await result.current.updateTrip(1, { status: 'delivered' });
        });
      } catch (error) {
        // Expected
      }

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('updateTripStatus', () => {
    it('should update trip status via updateTrip', async () => {
      const updatedTrip = { ...mockTrips[0], status: 'in_transit' as const };

      (apiClient.patch as jest.Mock).mockResolvedValue({
        data: updatedTrip,
        status: 200,
        isCached: false,
      });

      const { result } = renderHook(() => useTripsStore());

      act(() => {
        useTripsStore.setState({ trips: mockTrips });
      });

      await act(async () => {
        await result.current.updateTripStatus(1, 'in_transit');
      });

      expect(result.current.trips[0].status).toBe('in_transit');
    });
  });

  describe('setFilter', () => {
    it('should set filter', () => {
      const { result } = renderHook(() => useTripsStore());

      act(() => {
        result.current.setFilter({ status: 'booked', customerId: 5 });
      });

      expect(result.current.filter.status).toBe('booked');
      expect(result.current.filter.customerId).toBe(5);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const { result } = renderHook(() => useTripsStore());

      act(() => {
        useTripsStore.setState({ error: 'Test error' });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
