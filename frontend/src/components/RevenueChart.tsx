import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { RevenueMetric } from '../hooks/useAnalytics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface RevenueChartProps {
  data: RevenueMetric[];
  loading: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  const chartData = {
    labels: data.slice(0, 30).map((item) => {
      const date = new Date(item.period);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Revenue (PKR)',
        data: data.slice(0, 30).map((item) => item.total_revenue / 1000000),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Payment Received (PKR)',
        data: data.slice(0, 30).map((item) => item.payment_received / 1000000),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (Million PKR)',
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Revenue Trend
      </h2>
      {loading ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      ) : (
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
