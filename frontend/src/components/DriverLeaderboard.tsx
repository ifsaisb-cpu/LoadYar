import React from 'react';
import { Award, TrendingUp, Star } from 'lucide-react';
import type { DriverMetric } from '../hooks/useAnalytics';

interface DriverLeaderboardProps {
  drivers: DriverMetric[];
  loading: boolean;
}

const DriverLeaderboard: React.FC<DriverLeaderboardProps> = ({ drivers, loading }) => {
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 1:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 2:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Award size={24} />
          Top Drivers
        </h2>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          Loading driver rankings...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Driver
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Trips
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Earnings
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rating
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  On-Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {drivers.map((driver, idx) => (
                <tr
                  key={driver.driver_id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                    idx < 3 ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                  }`}
                >
                  <td className={`px-6 py-4 font-bold text-center ${getMedalColor(idx)}`}>
                    {getMedalIcon(idx)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {driver.driver_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    <div className="text-sm font-medium">
                      {driver.trips_completed} ✓
                    </div>
                    {driver.trips_cancelled > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {driver.trips_cancelled} ✗
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-semibold">
                    PKR {(driver.total_earnings / 1000).toFixed(0)}K
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={16} className="text-yellow-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {driver.average_rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      {driver.on_time_deliveries} / {driver.trips_completed}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverLeaderboard;
