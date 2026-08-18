import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, RefreshCw } from 'lucide-react';
import { useAnalytics } from './hooks/useAnalytics';
import { useWebSocket } from './hooks/useWebSocket';
import KPICards from './components/KPICards';
import RevenueChart from './components/RevenueChart';
import TripAnalyticsChart from './components/TripAnalyticsChart';
import DriverLeaderboard from './components/DriverLeaderboard';
import DateRangePicker from './components/DateRangePicker';
import { exportAnalytics } from './utils/export';
import './App.css';

const App: React.FC = () => {
  const [tenantId] = useState(1);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { kpis, tripAnalytics, revenue, drivers, loading, error, refetch } =
    useAnalytics(tenantId, startDate, endDate);

  const { isConnected } = useWebSocket(tenantId);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleExport = useCallback(async (reportType: string) => {
    await exportAnalytics(tenantId, reportType, startDate, endDate);
  }, [tenantId, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                LoadYar Analytics Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Real-time business intelligence & performance metrics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Date Range & Export */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('trips')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <KPICards kpis={kpis} loading={loading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <RevenueChart data={revenue} loading={loading} />
          <TripAnalyticsChart data={tripAnalytics} loading={loading} />
        </div>

        {/* Driver Leaderboard */}
        <div className="mt-8">
          <DriverLeaderboard drivers={drivers} loading={loading} />
        </div>
      </main>
    </div>
  );
};

export default App;
