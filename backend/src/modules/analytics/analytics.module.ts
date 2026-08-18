import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnalyticsDailyMetric,
  AnalyticsDriverPerformance,
  AnalyticsCustomerMetric,
  AnalyticsRevenueSummary,
  AnalyticsCache,
} from '../../entities/analytics.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsDailyMetric,
      AnalyticsDriverPerformance,
      AnalyticsCustomerMetric,
      AnalyticsRevenueSummary,
      AnalyticsCache,
    ]),
  ],
  providers: [AnalyticsService, AnalyticsGateway],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule {}
