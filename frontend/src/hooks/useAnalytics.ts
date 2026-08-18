import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';

export interface DashboardKPI {
  total_revenue: number;
  active_trips: number;
  online_drivers: number;
  total_customers: number;
  avg_rating: number;
  success_rate: number;
}

export interface TripAnalytics {
  total_revenue: number;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  avg_trip_distance: number;
  total_distance: number;
  avg_delivery_time_minutes: number;
  success_rate: number;
}

export interface RevenueMetric {
  period: string;
  total_revenue: number;
  payment_received: number;
  pending_payment: number;
  refunded: number;
  transaction_count: number;
  success_rate: number;
  avg_transaction_value: number;
}

export interface DriverMetric {
  driver_id: number;
  driver_name: string;
  trips_completed: number;
  trips_cancelled: number;
  total_earnings: number;
  total_expenses: number;
  total_distance: number;
  average_rating: number;
  total_ratings: number;
  fuel_efficiency_km_per_liter: number;
  on_time_deliveries: number;
}

interface UseAnalyticsReturn {
  kpis: DashboardKPI | null;
  tripAnalytics: TripAnalytics | null;
  revenue: RevenueMetric[];
  drivers: DriverMetric[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAnalytics = (
  tenantId: number,
  startDate: Date,
  endDate: Date,
): UseAnalyticsReturn => {
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [tripAnalytics, setTripAnalytics] = useState<TripAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueMetric[]>([]);
  const [drivers, setDrivers] = useState<DriverMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch all analytics in parallel
      const [kpiRes, tripRes, revenueRes, driverRes] = await Promise.all([
        apiClient.get('/analytics/dashboard/kpis', {
          params: { tenant_id: tenantId },
        }),
        apiClient.get('/analytics/trips', {
          params: {
            tenant_id: tenantId,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
          },
        }),
        apiClient.get('/analytics/revenue', {
          params: { tenant_id: tenantId, period_type: 'daily' },
        }),
        apiClient.get('/analytics/drivers/performance', {
          params: { tenant_id: tenantId, limit: 10 },
        }),
      ]);

      setKpis(kpiRes.data);
      setTripAnalytics(tripRes.data);
      setRevenue(revenueRes.data);
      setDrivers(driverRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    kpis,
    tripAnalytics,
    revenue,
    drivers,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
