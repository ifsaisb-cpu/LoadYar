import { DataSource } from 'typeorm';
import { Tenant, User, TenantSubscription, TenantConfiguration, ImportJob, OnboardingProgress, BillingEvent } from '../entities/tenant.entity';
import { AnalyticsDailyMetric, AnalyticsDriverPerformance, AnalyticsCustomerMetric, AnalyticsRevenueSummary, AnalyticsCache } from '../entities/analytics.entity';

const isTestEnv = process.env.DB_HOST && process.env.DB_PORT;

const dataSource = new DataSource({
  type: isTestEnv ? 'postgres' : 'better-sqlite3',
  host: process.env.DB_HOST || 'localhost',
  port: isTestEnv ? parseInt(process.env.DB_PORT || '5432') : undefined,
  username: process.env.DB_USER || 'test',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME || 'loadyar.db',
  entities: [
    Tenant,
    User,
    TenantSubscription,
    TenantConfiguration,
    ImportJob,
    OnboardingProgress,
    BillingEvent,
    AnalyticsDailyMetric,
    AnalyticsDriverPerformance,
    AnalyticsCustomerMetric,
    AnalyticsRevenueSummary,
    AnalyticsCache,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: false,
});

export default dataSource;
