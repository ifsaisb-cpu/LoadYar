import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyReport {
  date: number;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_distance: number;
  total_earnings: number;
  total_expenses: number;
  net_earnings: number;
  average_rating: number;
  on_time_percentage: number;
  revenue_per_km: number;
  avg_trip_value: number;
}

export interface WeeklyReport {
  week_start: number;
  week_end: number;
  total_trips: number;
  completed_trips: number;
  total_distance: number;
  total_earnings: number;
  total_expenses: number;
  net_earnings: number;
  average_rating: number;
  on_time_percentage: number;
  daily_breakdown: DailyReport[];
}

export interface MonthlyReport {
  month: number;
  year: number;
  total_trips: number;
  completed_trips: number;
  total_distance: number;
  total_earnings: number;
  total_expenses: number;
  net_earnings: number;
  average_rating: number;
  on_time_percentage: number;
  revenue_per_km: number;
  top_earning_day: DailyReport;
  worst_day: DailyReport;
  weekly_breakdown: WeeklyReport[];
}

export interface DriverPerformanceReport {
  driver_id: number;
  driver_name: string;
  total_trips: number;
  completed_trips: number;
  average_rating: number;
  on_time_percentage: number;
  total_distance: number;
  total_earnings: number;
  net_earnings: number;
  avg_trip_value: number;
  incident_count: number;
  cancellation_rate: number;
  peak_hour: number;
  favorite_route: string;
}

export interface FleetAnalytics {
  total_drivers: number;
  active_drivers: number;
  total_vehicles: number;
  active_vehicles: number;
  daily_active_trips: number;
  daily_completed_trips: number;
  daily_revenue: number;
  daily_costs: number;
  daily_profit: number;
  fleet_utilization: number;
  average_fleet_rating: number;
  on_time_performance: number;
  total_distance_covered: number;
  cost_per_km: number;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  metrics: string[];
  filters: Record<string, any>;
  period_start: number;
  period_end: number;
  generated_at: number;
  generated_by: string;
  data: Record<string, any>;
}

export interface ReportExport {
  id: string;
  report_id: string;
  format: 'pdf' | 'csv' | 'json' | 'excel';
  file_name: string;
  file_size: number;
  created_at: number;
  download_url?: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
}

interface ReportingStore {
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
  driverPerformance: DriverPerformanceReport[];
  fleetAnalytics: FleetAnalytics;
  customReports: CustomReport[];
  exports: ReportExport[];

  generateDailyReport: (date: number, driverId?: number) => DailyReport;
  generateWeeklyReport: (weekStart: number) => WeeklyReport;
  generateMonthlyReport: (month: number, year: number) => MonthlyReport;
  generateDriverPerformanceReport: (driverId: number, period?: 'week' | 'month') => DriverPerformanceReport;
  generateFleetAnalytics: () => FleetAnalytics;
  createCustomReport: (name: string, metrics: string[], filters: Record<string, any>) => CustomReport;
  exportReport: (reportId: string, format: 'pdf' | 'csv' | 'json' | 'excel') => Promise<ReportExport>;
  getReportTrend: (reportIds: string[]) => Record<string, number[]>;
  compareReports: (reportId1: string, reportId2: string) => Record<string, any>;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const mockDailyData: DailyReport = {
  date: Date.now(),
  total_trips: 12,
  completed_trips: 11,
  cancelled_trips: 1,
  total_distance: 287.4,
  total_earnings: 18500,
  total_expenses: 3200,
  net_earnings: 15300,
  average_rating: 4.8,
  on_time_percentage: 91.7,
  revenue_per_km: 64.4,
  avg_trip_value: 1541.67,
};

export const useReportingStore = create<ReportingStore>((set, get) => ({
  dailyReports: [],
  weeklyReports: [],
  monthlyReports: [],
  driverPerformance: [],
  fleetAnalytics: {
    total_drivers: 0,
    active_drivers: 0,
    total_vehicles: 0,
    active_vehicles: 0,
    daily_active_trips: 0,
    daily_completed_trips: 0,
    daily_revenue: 0,
    daily_costs: 0,
    daily_profit: 0,
    fleet_utilization: 0,
    average_fleet_rating: 0,
    on_time_performance: 0,
    total_distance_covered: 0,
    cost_per_km: 0,
  },
  customReports: [],
  exports: [],

  generateDailyReport: (date: number, driverId?: number) => {
    const report: DailyReport = {
      ...mockDailyData,
      date,
      total_trips: Math.floor(Math.random() * 20) + 5,
      completed_trips: Math.floor(Math.random() * 18) + 4,
      total_distance: Math.random() * 400 + 100,
      total_earnings: Math.floor(Math.random() * 25000) + 10000,
      total_expenses: Math.floor(Math.random() * 5000) + 2000,
    };

    report.net_earnings = report.total_earnings - report.total_expenses;
    report.revenue_per_km = Math.round((report.total_earnings / report.total_distance) * 100) / 100;
    report.avg_trip_value = Math.round(report.total_earnings / report.completed_trips);
    report.on_time_percentage = Math.random() * 100;

    const reports = get().dailyReports;
    set({ dailyReports: [...reports, report] });
    get().saveToStorage();

    return report;
  },

  generateWeeklyReport: (weekStart: number) => {
    const dailyBreakdown: DailyReport[] = [];
    let totalTrips = 0;
    let totalEarnings = 0;
    let totalExpenses = 0;
    let totalDistance = 0;
    let ratingSum = 0;
    let onTimeSum = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = weekStart + i * 24 * 60 * 60 * 1000;
      const daily = get().generateDailyReport(dayDate);
      dailyBreakdown.push(daily);

      totalTrips += daily.completed_trips;
      totalEarnings += daily.total_earnings;
      totalExpenses += daily.total_expenses;
      totalDistance += daily.total_distance;
      ratingSum += daily.average_rating;
      onTimeSum += daily.on_time_percentage;
    }

    const report: WeeklyReport = {
      week_start: weekStart,
      week_end: weekStart + 6 * 24 * 60 * 60 * 1000,
      total_trips: dailyBreakdown.reduce((sum, d) => sum + d.total_trips, 0),
      completed_trips: totalTrips,
      total_distance: totalDistance,
      total_earnings: totalEarnings,
      total_expenses: totalExpenses,
      net_earnings: totalEarnings - totalExpenses,
      average_rating: ratingSum / 7,
      on_time_percentage: onTimeSum / 7,
      daily_breakdown: dailyBreakdown,
    };

    const reports = get().weeklyReports;
    set({ weeklyReports: [...reports, report] });
    get().saveToStorage();

    return report;
  },

  generateMonthlyReport: (month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();

    const weeklyBreakdown: WeeklyReport[] = [];
    const dailyReports: DailyReport[] = [];

    for (let week = 0; week < Math.ceil(daysInMonth / 7); week++) {
      const weekStart = new Date(year, month - 1, week * 7 + 1).getTime();
      const weekReport = get().generateWeeklyReport(weekStart);
      weeklyBreakdown.push(weekReport);
      dailyReports.push(...weekReport.daily_breakdown);
    }

    const topDay = dailyReports.reduce((max, d) => (d.total_earnings > max.total_earnings ? d : max));
    const worstDay = dailyReports.reduce((min, d) => (d.total_earnings < min.total_earnings ? d : min));

    const report: MonthlyReport = {
      month,
      year,
      total_trips: dailyReports.reduce((sum, d) => sum + d.total_trips, 0),
      completed_trips: dailyReports.reduce((sum, d) => sum + d.completed_trips, 0),
      total_distance: dailyReports.reduce((sum, d) => sum + d.total_distance, 0),
      total_earnings: dailyReports.reduce((sum, d) => sum + d.total_earnings, 0),
      total_expenses: dailyReports.reduce((sum, d) => sum + d.total_expenses, 0),
      net_earnings: dailyReports.reduce((sum, d) => sum + d.net_earnings, 0),
      average_rating: dailyReports.reduce((sum, d) => sum + d.average_rating, 0) / dailyReports.length,
      on_time_percentage: dailyReports.reduce((sum, d) => sum + d.on_time_percentage, 0) / dailyReports.length,
      revenue_per_km: 0,
      top_earning_day: topDay,
      worst_day: worstDay,
      weekly_breakdown: weeklyBreakdown,
    };

    report.revenue_per_km = Math.round((report.total_earnings / report.total_distance) * 100) / 100;

    const reports = get().monthlyReports;
    set({ monthlyReports: [...reports, report] });
    get().saveToStorage();

    return report;
  },

  generateDriverPerformanceReport: (driverId: number, period?: 'week' | 'month') => {
    const dailyReports = get().dailyReports;
    const filtered = dailyReports.slice(-14); // Last 14 days

    const report: DriverPerformanceReport = {
      driver_id: driverId,
      driver_name: `Driver ${driverId}`,
      total_trips: filtered.reduce((sum, d) => sum + d.total_trips, 0),
      completed_trips: filtered.reduce((sum, d) => sum + d.completed_trips, 0),
      average_rating: filtered.reduce((sum, d) => sum + d.average_rating, 0) / filtered.length,
      on_time_percentage: filtered.reduce((sum, d) => sum + d.on_time_percentage, 0) / filtered.length,
      total_distance: filtered.reduce((sum, d) => sum + d.total_distance, 0),
      total_earnings: filtered.reduce((sum, d) => sum + d.total_earnings, 0),
      net_earnings: filtered.reduce((sum, d) => sum + d.net_earnings, 0),
      avg_trip_value: 0,
      incident_count: Math.floor(Math.random() * 3),
      cancellation_rate: Math.random() * 10,
      peak_hour: Math.floor(Math.random() * 24),
      favorite_route: `Route-${Math.floor(Math.random() * 50)}`,
    };

    report.avg_trip_value = Math.round(report.total_earnings / report.completed_trips);

    const performance = get().driverPerformance;
    set({ driverPerformance: [...performance, report] });
    get().saveToStorage();

    return report;
  },

  generateFleetAnalytics: () => {
    const analytics: FleetAnalytics = {
      total_drivers: 45,
      active_drivers: Math.floor(Math.random() * 35) + 10,
      total_vehicles: 50,
      active_vehicles: Math.floor(Math.random() * 40) + 15,
      daily_active_trips: Math.floor(Math.random() * 200) + 100,
      daily_completed_trips: Math.floor(Math.random() * 180) + 80,
      daily_revenue: Math.floor(Math.random() * 500000) + 300000,
      daily_costs: Math.floor(Math.random() * 80000) + 40000,
      daily_profit: 0,
      fleet_utilization: Math.random() * 30 + 60,
      average_fleet_rating: Math.random() * 1 + 4,
      on_time_performance: Math.random() * 20 + 80,
      total_distance_covered: Math.random() * 5000 + 3000,
      cost_per_km: 0,
    };

    analytics.daily_profit = analytics.daily_revenue - analytics.daily_costs;
    analytics.cost_per_km = Math.round((analytics.daily_costs / analytics.total_distance_covered) * 100) / 100;

    set({ fleetAnalytics: analytics });
    get().saveToStorage();

    return analytics;
  },

  createCustomReport: (name: string, metrics: string[], filters: Record<string, any>) => {
    const report: CustomReport = {
      id: `${Date.now()}_${Math.random()}`,
      name,
      description: `Custom report: ${name}`,
      type: 'custom',
      metrics,
      filters,
      period_start: Date.now() - 30 * 24 * 60 * 60 * 1000,
      period_end: Date.now(),
      generated_at: Date.now(),
      generated_by: 'system',
      data: {},
    };

    const reports = get().customReports;
    set({ customReports: [...reports, report] });
    get().saveToStorage();

    return report;
  },

  exportReport: async (reportId: string, format: 'pdf' | 'csv' | 'json' | 'excel') => {
    const export_: ReportExport = {
      id: `${Date.now()}_${Math.random()}`,
      report_id: reportId,
      format,
      file_name: `report_${reportId}.${format}`,
      file_size: Math.floor(Math.random() * 2000000) + 500000,
      created_at: Date.now(),
      status: 'generating',
    };

    let exports = get().exports;
    set({ exports: [...exports, export_] });

    // Simulate export generation
    return new Promise((resolve) => {
      setTimeout(() => {
        const updated = {
          ...export_,
          status: 'ready' as const,
          download_url: `https://loadyar.com/exports/${export_.id}`,
        };

        exports = get().exports.map((e) => (e.id === export_.id ? updated : e));
        set({ exports });
        get().saveToStorage();

        resolve(updated);
      }, 2000);
    });
  },

  getReportTrend: (reportIds: string[]) => {
    const allReports = [
      ...get().dailyReports,
      ...get().weeklyReports.map((w) => ({ ...w, total_trips: w.total_trips })),
    ];

    const trends: Record<string, number[]> = {};

    for (const reportId of reportIds) {
      const matching = allReports.filter((r) => r.id?.includes(reportId) || true);
      trends[reportId] = matching.map((r) => r.total_earnings || 0);
    }

    return trends;
  },

  compareReports: (reportId1: string, reportId2: string) => {
    const dailyReports = get().dailyReports;
    const report1 = dailyReports.find((r) => r.date.toString().includes(reportId1));
    const report2 = dailyReports.find((r) => r.date.toString().includes(reportId2));

    if (!report1 || !report2) return {};

    return {
      earnings_diff: report2.total_earnings - report1.total_earnings,
      earnings_diff_percentage: ((report2.total_earnings - report1.total_earnings) / report1.total_earnings) * 100,
      trips_diff: report2.completed_trips - report1.completed_trips,
      distance_diff: report2.total_distance - report1.total_distance,
      rating_diff: report2.average_rating - report1.average_rating,
    };
  },

  saveToStorage: async () => {
    try {
      const { dailyReports, weeklyReports, monthlyReports, customReports, exports } = get();
      await Promise.all([
        AsyncStorage.setItem('dailyReports', JSON.stringify(dailyReports)),
        AsyncStorage.setItem('weeklyReports', JSON.stringify(weeklyReports)),
        AsyncStorage.setItem('monthlyReports', JSON.stringify(monthlyReports)),
        AsyncStorage.setItem('customReports', JSON.stringify(customReports)),
        AsyncStorage.setItem('reportExports', JSON.stringify(exports)),
      ]);
    } catch (error) {
      console.error('Failed to save reports:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      const [daily, weekly, monthly, custom, exports_] = await Promise.all([
        AsyncStorage.getItem('dailyReports'),
        AsyncStorage.getItem('weeklyReports'),
        AsyncStorage.getItem('monthlyReports'),
        AsyncStorage.getItem('customReports'),
        AsyncStorage.getItem('reportExports'),
      ]);

      if (daily) set({ dailyReports: JSON.parse(daily) });
      if (weekly) set({ weeklyReports: JSON.parse(weekly) });
      if (monthly) set({ monthlyReports: JSON.parse(monthly) });
      if (custom) set({ customReports: JSON.parse(custom) });
      if (exports_) set({ exports: JSON.parse(exports_) });
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  },
}));
