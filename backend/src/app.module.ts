import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Tenant, User, TenantSubscription, TenantConfiguration, ImportJob, OnboardingProgress, BillingEvent } from './entities/tenant.entity';
import { AnalyticsDailyMetric, AnalyticsDriverPerformance, AnalyticsCustomerMetric, AnalyticsRevenueSummary, AnalyticsCache } from './entities/analytics.entity';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ImportModule } from './modules/import/import.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { BillingModule } from './modules/billing/billing.module';
import { TripsModule } from './modules/trips/trips.module';
import { GpsModule } from './modules/gps/gps.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_NAME || 'loadyar.db',
      entities: [Tenant, User, TenantSubscription, TenantConfiguration, ImportJob, OnboardingProgress, BillingEvent, AnalyticsDailyMetric, AnalyticsDriverPerformance, AnalyticsCustomerMetric, AnalyticsRevenueSummary, AnalyticsCache],
      synchronize: true,
      logging: process.env.DB_LOGGING === 'true',
    }),
    TypeOrmModule.forFeature([Tenant, User, TenantSubscription, TenantConfiguration, ImportJob, OnboardingProgress, BillingEvent, AnalyticsDailyMetric, AnalyticsDriverPerformance, AnalyticsCustomerMetric, AnalyticsRevenueSummary, AnalyticsCache]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'loadyar-dev-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
    TenantsModule,
    ImportModule,
    OnboardingModule,
    BillingModule,
    TripsModule,
    GpsModule,
    NotificationsModule,
    PaymentsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
