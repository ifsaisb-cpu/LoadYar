import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnalyticsDailyMetric,
  AnalyticsDriverPerformance,
  AnalyticsCustomerMetric,
  AnalyticsRevenueSummary,
  AnalyticsCache,
  TripAnalyticsDTO,
  DriverPerformanceDTO,
  RevenueAnalyticsDTO,
  DashboardKPIDTO,
} from '../../entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsDailyMetric)
    private dailyMetricsRepo: Repository<AnalyticsDailyMetric>,
    @InjectRepository(AnalyticsDriverPerformance)
    private driverPerformanceRepo: Repository<AnalyticsDriverPerformance>,
    @InjectRepository(AnalyticsCustomerMetric)
    private customerMetricsRepo: Repository<AnalyticsCustomerMetric>,
    @InjectRepository(AnalyticsRevenueSummary)
    private revenueSummaryRepo: Repository<AnalyticsRevenueSummary>,
    @InjectRepository(AnalyticsCache)
    private cacheRepo: Repository<AnalyticsCache>,
  ) {}

  // Dashboard KPIs
  async getDashboardKPIs(tenant_id: number): Promise<DashboardKPIDTO> {
    const cacheKey = `dashboard_kpis_${tenant_id}`;
    const cached = await this.getCache(tenant_id, cacheKey);
    if (cached) return cached;

    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyMetric = await this.dailyMetricsRepo.findOne({
      where: { tenant_id, date: today },
    });

    // Mock live data (would come from real-time trip data in production)
    const kpis: DashboardKPIDTO = {
      total_revenue: dailyMetric?.total_revenue || 0,
      active_trips: Math.floor(Math.random() * 50) + 10,
      online_drivers: Math.floor(Math.random() * 30) + 5,
      total_customers: 150,
      avg_rating: 4.6,
      success_rate: 98.5,
    };

    await this.setCache(tenant_id, cacheKey, kpis, 5); // 5 min cache
    return kpis;
  }

  // Trip analytics for date range
  async getTripAnalytics(
    tenant_id: number,
    startDate: Date,
    endDate: Date,
  ): Promise<TripAnalyticsDTO> {
    const cacheKey = `trip_analytics_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = await this.getCache(tenant_id, cacheKey);
    if (cached) return cached;

    const metrics = await this.dailyMetricsRepo
      .createQueryBuilder('m')
      .where('m.tenant_id = :tenant_id', { tenant_id })
      .andWhere('m.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .select('SUM(m.total_revenue)', 'total_revenue')
      .addSelect('SUM(m.total_trips)', 'total_trips')
      .addSelect('SUM(m.completed_trips)', 'completed_trips')
      .addSelect('SUM(m.cancelled_trips)', 'cancelled_trips')
      .addSelect('AVG(m.avg_trip_distance)', 'avg_trip_distance')
      .addSelect('SUM(m.total_distance)', 'total_distance')
      .addSelect('AVG(m.avg_delivery_time_minutes)', 'avg_delivery_time_minutes')
      .getRawOne();

    const total_trips = parseInt(metrics.total_trips) || 0;
    const completed_trips = parseInt(metrics.completed_trips) || 0;
    const success_rate = total_trips > 0 ? (completed_trips / total_trips) * 100 : 0;

    const result: TripAnalyticsDTO = {
      total_revenue: parseFloat(metrics.total_revenue) || 0,
      total_trips,
      completed_trips,
      cancelled_trips: parseInt(metrics.cancelled_trips) || 0,
      avg_trip_distance: parseFloat(metrics.avg_trip_distance) || 0,
      total_distance: parseFloat(metrics.total_distance) || 0,
      avg_delivery_time_minutes: parseFloat(metrics.avg_delivery_time_minutes) || 0,
      success_rate: Math.round(success_rate * 100) / 100,
    };

    await this.setCache(tenant_id, cacheKey, result, 15); // 15 min cache
    return result;
  }

  // Driver performance rankings
  async getDriverPerformance(
    tenant_id: number,
    limit = 10,
    date?: Date,
  ): Promise<DriverPerformanceDTO[]> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const cacheKey = `driver_perf_${targetDate.toISOString()}`;
    const cached = await this.getCache(tenant_id, cacheKey);
    if (cached) return cached;

    const drivers = await this.driverPerformanceRepo
      .createQueryBuilder('dp')
      .where('dp.tenant_id = :tenant_id', { tenant_id })
      .andWhere('dp.date = :date', { date: targetDate })
      .orderBy('dp.total_earnings', 'DESC')
      .limit(limit)
      .getMany();

    const result = drivers.map((d) => ({
      driver_id: d.driver_id,
      driver_name: d.driver_name,
      trips_completed: d.trips_completed,
      trips_cancelled: d.trips_cancelled,
      total_earnings: d.total_earnings,
      total_expenses: d.total_expenses,
      total_distance: d.total_distance,
      average_rating: d.average_rating,
      total_ratings: d.total_ratings,
      fuel_efficiency_km_per_liter: d.fuel_efficiency_km_per_liter,
      on_time_deliveries: d.on_time_deliveries,
    }));

    await this.setCache(tenant_id, cacheKey, result, 10);
    return result;
  }

  // Revenue analytics by period
  async getRevenueAnalytics(
    tenant_id: number,
    periodType: 'daily' | 'weekly' | 'monthly',
    limit = 30,
  ): Promise<RevenueAnalyticsDTO[]> {
    const cacheKey = `revenue_${periodType}_${limit}`;
    const cached = await this.getCache(tenant_id, cacheKey);
    if (cached) return cached;

    const summaries = await this.revenueSummaryRepo
      .createQueryBuilder('rs')
      .where('rs.tenant_id = :tenant_id', { tenant_id })
      .andWhere('rs.period_type = :periodType', { periodType })
      .orderBy('rs.period_date', 'DESC')
      .limit(limit)
      .getMany();

    const result = summaries.map((s) => ({
      period: s.period_date.toISOString(),
      total_revenue: s.total_revenue,
      payment_received: s.payment_received,
      pending_payment: s.pending_payment,
      refunded: s.refunded,
      transaction_count: s.transaction_count,
      success_rate: s.success_rate,
      avg_transaction_value: s.transaction_count > 0 ? s.total_revenue / s.transaction_count : 0,
    }));

    await this.setCache(tenant_id, cacheKey, result, 30);
    return result;
  }

  // Customer metrics for period
  async getCustomerAnalytics(
    tenant_id: number,
    startDate: Date,
    endDate: Date,
    limit = 10,
  ): Promise<any[]> {
    const customers = await this.customerMetricsRepo
      .createQueryBuilder('cm')
      .where('cm.tenant_id = :tenant_id', { tenant_id })
      .andWhere('cm.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('cm.total_spent', 'DESC')
      .limit(limit)
      .getMany();

    return customers.map((c) => ({
      customer_id: c.customer_id,
      customer_name: c.customer_name,
      orders_placed: c.orders_placed,
      orders_completed: c.orders_completed,
      total_spent: c.total_spent,
      avg_order_value: c.avg_order_value,
    }));
  }

  // Aggregate metrics by time period
  async getMetricsByDateRange(
    tenant_id: number,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsDailyMetric[]> {
    return this.dailyMetricsRepo
      .createQueryBuilder('m')
      .where('m.tenant_id = :tenant_id', { tenant_id })
      .andWhere('m.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('m.date', 'ASC')
      .getMany();
  }

  // Live metrics (last 24 hours)
  async getLiveMetrics(tenant_id: number): Promise<AnalyticsDailyMetric> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let metric = await this.dailyMetricsRepo.findOne({
      where: { tenant_id, date: today },
    });

    if (!metric) {
      metric = this.dailyMetricsRepo.create({
        tenant_id,
        date: today,
        total_revenue: 0,
        total_expenses: 0,
        total_trips: 0,
        completed_trips: 0,
        cancelled_trips: 0,
        avg_trip_distance: 0,
        total_distance: 0,
        active_drivers: 0,
        avg_delivery_time_minutes: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await this.dailyMetricsRepo.save(metric);
    }

    return metric;
  }

  // Refresh daily metrics (called by cron or after trip completion)
  async refreshDailyMetrics(tenant_id: number, date: Date): Promise<void> {
    // Invalidate cache
    await this.cacheRepo.delete({
      tenant_id,
      metric_type: 'daily_metrics',
    });
  }

  // Cache utilities
  private async getCache(tenant_id: number, key: string): Promise<any> {
    const cache = await this.cacheRepo.findOne({
      where: { tenant_id, metric_type: key },
    });

    if (!cache || new Date() > cache.expires_at) {
      return null;
    }

    try {
      return JSON.parse(cache.cached_data);
    } catch {
      return null;
    }
  }

  private async setCache(
    tenant_id: number,
    key: string,
    data: any,
    ttlMinutes = 15,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    await this.cacheRepo.upsert(
      {
        tenant_id,
        metric_type: key,
        date_range: 'current',
        cached_data: JSON.stringify(data),
        cached_at: new Date(),
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date(),
      },
      ['tenant_id', 'metric_type'],
    );
  }

  // Clear all caches for tenant
  async clearCache(tenant_id: number): Promise<void> {
    await this.cacheRepo.delete({ tenant_id });
  }

  // Utility: Compute top performers
  async getTopPerformers(
    tenant_id: number,
    metric: 'earnings' | 'rating' | 'trips' = 'earnings',
    limit = 5,
  ): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = this.driverPerformanceRepo
      .createQueryBuilder('dp')
      .where('dp.tenant_id = :tenant_id', { tenant_id })
      .andWhere('dp.date = :date', { date: today });

    if (metric === 'earnings') {
      query = query.orderBy('dp.total_earnings', 'DESC');
    } else if (metric === 'rating') {
      query = query.orderBy('dp.average_rating', 'DESC');
    } else if (metric === 'trips') {
      query = query.orderBy('dp.trips_completed', 'DESC');
    }

    return query.limit(limit).getMany();
  }
}
