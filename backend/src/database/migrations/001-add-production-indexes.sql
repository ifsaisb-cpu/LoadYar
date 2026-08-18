-- Production Performance Indexes Migration
-- Fixes N+1 queries and slow dashboard loads

-- Analytics indexes for fast date range queries
CREATE INDEX IF NOT EXISTS idx_daily_metrics_tenant_date
  ON analytics_daily_metrics(tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_driver_perf_tenant_date
  ON analytics_driver_performance(tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_revenue_summary_tenant_date
  ON analytics_revenue_summary(tenant_id, period_date);

CREATE INDEX IF NOT EXISTS idx_customer_metrics_tenant_date
  ON analytics_customer_metrics(tenant_id, date);

-- Trip indexes for active trips queries
CREATE INDEX IF NOT EXISTS idx_trips_tenant_status
  ON trips(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_trips_tenant_driver
  ON trips(tenant_id, driver_id);

CREATE INDEX IF NOT EXISTS idx_trips_tenant_customer
  ON trips(tenant_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_trips_created_date
  ON trips(tenant_id, DATE(created_at));

-- Driver indexes for online drivers and leaderboard
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_online
  ON drivers(tenant_id, is_online);

CREATE INDEX IF NOT EXISTS idx_drivers_tenant_rating
  ON drivers(tenant_id, rating DESC);

-- Transaction indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date
  ON transactions(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_status
  ON transactions(tenant_id, status);

-- Delivery proof indexes
CREATE INDEX IF NOT EXISTS idx_delivery_proof_tenant_trip
  ON delivery_proof(tenant_id, trip_id);

CREATE INDEX IF NOT EXISTS idx_delivery_proof_tenant_date
  ON delivery_proof(tenant_id, created_at DESC);

-- GPS tracking indexes for location queries
CREATE INDEX IF NOT EXISTS idx_gps_tracking_driver_date
  ON gps_tracking(driver_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gps_tracking_tenant_date
  ON gps_tracking(tenant_id, recorded_at DESC);

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_trips_driver_status_date
  ON trips(tenant_id, driver_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drivers_perf_lookup
  ON drivers(tenant_id, id, rating, is_online);
