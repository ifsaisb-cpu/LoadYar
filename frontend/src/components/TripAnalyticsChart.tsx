import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TripAnalytics } from '../hooks/useAnalytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TripAnalyticsChartProps {
  data: TripAnalytics | null;
  loading: boolean;
}

const TripAnalyticsChart: React.FC<TripAnalyticsChartProps> = ({ data, loading }) => {
  const chartData = {
    labels: ['Completed', 'Cancelled', 'Success Rate %'],
    datasets: [
      {
        label: 'Trips',
        data: [
          data?.completed_trips || 0,
          data?.cancelled_trips || 0,
          (data?.success_rate || 0) * 10, // Scale for visibility
        ],
        backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
        borderColor: ['#059669', '#dc2626', '#1d4ed8'],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.raw.toFixed(0)} trips`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Trip Performance
      </h2>
      {loading ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      ) : (
        <div className="h-80">
          <Bar data={chartData} options={options} />
        </div>
      )}
      {data && (
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Avg Distance</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.avg_trip_distance.toFixed(1)} km
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Avg Time</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.avg_delivery_time_minutes.toFixed(0)} min
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.success_rate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripAnalyticsChart;
