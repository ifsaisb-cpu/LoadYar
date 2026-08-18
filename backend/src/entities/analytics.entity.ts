import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('analytics_daily_metrics')
@Index(['tenant_id', 'date'])
export class AnalyticsDailyMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column('date')
  date: Date;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_revenue: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_expenses: number;

  @Column({ default: 0 })
  total_trips: number;

  @Column({ default: 0 })
  completed_trips: number;

  @Column({ default: 0 })
  cancelled_trips: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  avg_trip_distance: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total_distance: number;

  @Column({ default: 0 })
  active_drivers: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  avg_delivery_time_minutes: number;

  @Column('datetime')
  created_at: Date;

  @Column('datetime')
  updated_at: Date;
}

@Entity('analytics_driver_performance')
@Index(['tenant_id', 'driver_id'])
@Index(['tenant_id', 'date'])
export class AnalyticsDriverPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  driver_id: number;

  @Column()
  driver_name: string;

  @Column('date')
  date: Date;

  @Column({ default: 0 })
  trips_completed: number;

  @Column({ default: 0 })
  trips_cancelled: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_earnings: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_expenses: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total_distance: number;

  @Column('decimal', { precision: 5, scale: 2, default: 4.5 })
  average_rating: number;

  @Column({ default: 0 })
  total_ratings: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  fuel_efficiency_km_per_liter: number;

  @Column({ default: 0 })
  on_time_deliveries: number;

  @Column('datetime')
  created_at: Date;

  @Column('datetime')
  updated_at: Date;
}

@Entity('analytics_customer_metrics')
@Index(['tenant_id', 'customer_id'])
@Index(['tenant_id', 'date'])
export class AnalyticsCustomerMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  customer_id: number;

  @Column()
  customer_name: string;

  @Column('date')
  date: Date;

  @Column({ default: 0 })
  orders_placed: number;

  @Column({ default: 0 })
  orders_completed: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_spent: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  avg_order_value: number;

  @Column('datetime')
  created_at: Date;

  @Column('datetime')
  updated_at: Date;
}

@Entity('analytics_revenue_summary')
@Index(['tenant_id', 'period_type', 'period_date'])
export class AnalyticsRevenueSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  period_type: 'daily' | 'weekly' | 'monthly'; // day, week, month

  @Column('date')
  period_date: Date;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_revenue: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  payment_received: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  pending_payment: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  refunded: number;

  @Column({ default: 0 })
  transaction_count: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  success_rate: number; // percentage

  @Column('datetime')
  created_at: Date;

  @Column('datetime')
  updated_at: Date;
}

@Entity('analytics_cache')
@Index(['tenant_id', 'metric_type', 'date_range'])
export class AnalyticsCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  metric_type: string; // 'daily_metrics', 'driver_performance', 'revenue_summary', etc

  @Column()
  date_range: string; // 'last_7_days', 'last_30_days', 'last_quarter', etc

  @Column('text')
  cached_data: string; // JSON stringified data

  @Column('datetime')
  cached_at: Date;

  @Column('datetime')
  expires_at: Date;

  @Column('datetime')
  created_at: Date;

  @Column('datetime')
  updated_at: Date;
}

export interface TripAnalyticsDTO {
  total_revenue: number;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  avg_trip_distance: number;
  total_distance: number;
  avg_delivery_time_minutes: number;
  success_rate: number;
}

export interface DriverPerformanceDTO {
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

export interface RevenueAnalyticsDTO {
  period: string;
  total_revenue: number;
  payment_received: number;
  pending_payment: number;
  refunded: number;
  transaction_count: number;
  success_rate: number;
  avg_transaction_value: number;
}

export interface DashboardKPIDTO {
  total_revenue: number;
  active_trips: number;
  online_drivers: number;
  total_customers: number;
  avg_rating: number;
  success_rate: number;
}
