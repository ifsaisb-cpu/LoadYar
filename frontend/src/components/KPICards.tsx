import React from 'react';
import { TrendingUp, Users, Truck, Star } from 'lucide-react';
import type { DashboardKPI } from '../hooks/useAnalytics';

interface KPICardsProps {
  kpis: DashboardKPI | null;
  loading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis, loading }) => {
  const cards = [
    {
      title: 'Total Revenue',
      value: kpis?.total_revenue || 0,
      format: 'currency',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Active Trips',
      value: kpis?.active_trips || 0,
      format: 'number',
      icon: Truck,
      color: 'green',
    },
    {
      title: 'Online Drivers',
      value: kpis?.online_drivers || 0,
      format: 'number',
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Avg Rating',
      value: kpis?.avg_rating || 0,
      format: 'decimal',
      icon: Star,
      color: 'yellow',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return `PKR ${(value / 100000).toFixed(1)}L`;
    } else if (format === 'decimal') {
      return value.toFixed(1);
    } else {
      return Math.round(value).toString();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {loading ? '...' : formatValue(card.value, card.format)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
