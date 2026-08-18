import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // KPI Dashboard
  @Get('dashboard/kpis')
  async getDashboardKPIs(@Query('tenant_id') tenant_id: number) {
    return this.analyticsService.getDashboardKPIs(tenant_id);
  }

  // Trip analytics for date range
  @Get('trips')
  async getTripAnalytics(
    @Query('tenant_id') tenant_id: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getTripAnalytics(tenant_id, start, end);
  }

  // Driver performance rankings
  @Get('drivers/performance')
  async getDriverPerformance(
    @Query('tenant_id') tenant_id: number,
    @Query('limit') limit = 10,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : undefined;
    return this.analyticsService.getDriverPerformance(tenant_id, limit, targetDate);
  }

  // Revenue analytics by period
  @Get('revenue')
  async getRevenueAnalytics(
    @Query('tenant_id') tenant_id: number,
    @Query('period_type') periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('limit') limit = 30,
  ) {
    return this.analyticsService.getRevenueAnalytics(tenant_id, periodType, limit);
  }

  // Customer analytics
  @Get('customers')
  async getCustomerAnalytics(
    @Query('tenant_id') tenant_id: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('limit') limit = 10,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getCustomerAnalytics(tenant_id, start, end, limit);
  }

  // Metrics by date range
  @Get('metrics/range')
  async getMetricsByDateRange(
    @Query('tenant_id') tenant_id: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getMetricsByDateRange(tenant_id, start, end);
  }

  // Live metrics (last 24 hours)
  @Get('live')
  async getLiveMetrics(@Query('tenant_id') tenant_id: number) {
    return this.analyticsService.getLiveMetrics(tenant_id);
  }

  // Top performers
  @Get('top-performers')
  async getTopPerformers(
    @Query('tenant_id') tenant_id: number,
    @Query('metric') metric: 'earnings' | 'rating' | 'trips' = 'earnings',
    @Query('limit') limit = 5,
  ) {
    return this.analyticsService.getTopPerformers(tenant_id, metric, limit);
  }

  // Export analytics data (returns CSV-ready JSON)
  @Get('export')
  async exportAnalytics(
    @Query('tenant_id') tenant_id: number,
    @Query('report_type') reportType: 'trips' | 'drivers' | 'revenue' | 'customers',
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (reportType === 'trips') {
      return this.analyticsService.getTripAnalytics(tenant_id, start, end);
    } else if (reportType === 'drivers') {
      return this.analyticsService.getDriverPerformance(tenant_id, 100);
    } else if (reportType === 'revenue') {
      return this.analyticsService.getRevenueAnalytics(tenant_id, 'daily', 365);
    } else if (reportType === 'customers') {
      return this.analyticsService.getCustomerAnalytics(tenant_id, start, end, 500);
    }
  }
}
