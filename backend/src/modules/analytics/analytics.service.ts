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
    const today = this.getTenantDateBoundary(tenant_id);

    const dailyMetric = await this.dailyMetricsRepo.findOne({
      where: { tenant_id, date: today },
    });

    // Get real live data from queries
    const activeTrips = await this.getActiveTripsCount(tenant_id);
    const onlineDrivers = await this.getOnlineDriversCount(tenant_id);
    const totalCustomers = await this.getTotalCustomersCount(tenant_id);
    const avgRating = await this.getAverageDriverRating(tenant_id);
    const successRate = await this.getSuccessRate(tenant_id);

    const kpis: DashboardKPIDTO = {
      total_revenue: dailyMetric?.total_revenue || 0,
      active_trips: activeTrips,
      online_drivers: onlineDrivers,
      total_customers: totalCustomers,
      avg_rating: avgRating,
      success_rate: successRate,
    };

    await this.setCache(tenant_id, cacheKey, kpis, 5); // 5 min cache
    return kpis;
  }

  private async getActiveTripsCount(tenant_id: number): Promise<number> {
    const result = await this.dailyMetricsRepo
      .query(
        `SELECT COUNT(*) as count FROM trips
         WHERE tenant_id = $1 AND status IN ('assigned', 'in_progress')`,
        [tenant_id]
      );
    return result[0]?.count || 0;
  }

  private async getOnlineDriversCount(tenant_id: number): Promise<number> {
    const result = await this.dailyMetricsRepo
      .query(
        `SELECT COUNT(*) as count FROM drivers
         WHERE tenant_id = $1 AND is_online = true`,
        [tenant_id]
      );
    return result[0]?.count || 0;
  }

  private async getTotalCustomersCount(tenant_id: number): Promise<number> {
    const result = await this.dailyMetricsRepo
      .query(
        `SELECT COUNT(DISTINCT customer_id) as count FROM trips
         WHERE tenant_id = $1`,
        [tenant_id]
      );
    return result[0]?.count || 0;
  }

  private async getAverageDriverRating(tenant_id: number): Promise<number> {
    const result = await this.dailyMetricsRepo
      .query(
        `SELECT AVG(rating) as avg_rating FROM drivers
         WHERE tenant_id = $1 AND rating IS NOT NULL`,
        [tenant_id]
      );
    return Math.round((result[0]?.avg_rating || 4.0) * 10) / 10;
  }

  private async getSuccessRate(tenant_id: number): Promise<number> {
    const result = await this.dailyMetricsRepo
      .query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
         FROM trips WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE`,
        [tenant_id]
      );
    const total = result[0]?.total || 0;
    if (total === 0) return 0;
    return Math.round((result[0]?.completed / total) * 100);
  }

  private getTenantDateBoundary(tenant_id: number): Date {
    // Get timezone from tenant config (default: Asia/Karachi for PKT)
    const timezone = this.getTenantTimezone(tenant_id);
    const now = new Date();

    // Convert to tenant timezone and get start of day
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const [month, day, year] = formatter.format(now).split('/');
    const dateString = `${year}-${month}-${day}T00:00:00Z`;
    return new Date(dateString);
  }

  private getTenantTimezone(tenant_id: number): string {
    // TODO: Fetch from tenant configuration table
    // For now, default to Asia/Karachi (PKT)
    return 'Asia/Karachi';
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

  // Driver performance rankings (single query, no N+1)
  async getDriverPerformance(
    tenant_id: number,
    limit = 10,
    date?: Date,
  ): Promise<DriverPerformanceDTO[]> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const cacheKey = `driver_perf_${targetDate.toISOString()}_${limit}`;
    const cached = await this.getCache(tenant_id, cacheKey);
    if (cached) return cached;

    // Single efficient query with joins
    const drivers = await this.driverPerformanceRepo
      .createQueryBuilder('dp')
      .where('dp.tenant_id = :tenant_id', { tenant_id })
      .andWhere('dp.date = :date', { date: targetDate })
      .orderBy('dp.total_earnings', 'DESC')
      .limit(limit)
      .cache(`driver_leaderboard_${tenant_id}_${targetDate.getTime()}`, 300000) // 5 min cache
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

  // Alternative leaderboard using raw SQL for maximum performance
  async getDriverLeaderboardSQL(
    tenant_id: number,
    limit: number = 10,
  ): Promise<any[]> {
    const cacheKey = `driver_leaderboard_sql_${limit}`;
    const cached = await this.getCache(tenant_id, cacheKey);
    if (cached) return cached;

    const drivers = await this.driverPerformanceRepo.query(
      `SELECT
        d.id as driver_id,
        d.name as driver_name,
        d.rating as average_rating,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as trips_completed,
        COUNT(DISTINCT CASE WHEN t.status = 'cancelled' THEN t.id END) as trips_cancelled,
        COALESCE(SUM(t.fare_amount), 0) as total_earnings,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(t.distance), 0) as total_distance,
        COALESCE(AVG(tr.rating), 0) as avg_rating,
        COUNT(DISTINCT tr.id) as total_ratings,
        CASE WHEN SUM(t.distance) > 0 THEN SUM(e.liters) / SUM(t.distance) ELSE 0 END as fuel_efficiency,
        COUNT(DISTINCT CASE WHEN t.on_time = true THEN t.id END) as on_time_deliveries
      FROM drivers d
      LEFT JOIN trips t ON d.id = t.driver_id AND t.tenant_id = $1
      LEFT JOIN trip_expenses e ON t.id = e.trip_id
      LEFT JOIN trip_ratings tr ON t.id = tr.trip_id
      WHERE d.tenant_id = $1
      GROUP BY d.id, d.name, d.rating
      ORDER BY total_earnings DESC
      LIMIT $2`,
      [tenant_id, limit]
    );

    await this.setCache(tenant_id, cacheKey, drivers, 10);
    return drivers;
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
