import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useReportingStore } from '../store/reportingStore';
import type { FleetAnalytics } from '../store/reportingStore';

interface FleetAnalyticsDashboardProps {
  onClose: () => void;
}

export const FleetAnalyticsDashboard: React.FC<FleetAnalyticsDashboardProps> = ({ onClose }) => {
  const [analytics, setAnalytics] = useState<FleetAnalytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { generateFleetAnalytics } = useReportingStore();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    const data = generateFleetAnalytics();
    setAnalytics(data);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadAnalytics();
      setRefreshing(false);
    }, 1000);
  };

  if (!analytics) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📈 Fleet Analytics</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const profitMargin = ((analytics.daily_profit / analytics.daily_revenue) * 100).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📈 Fleet Analytics</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.refreshIcon}>{refreshing ? '⟳' : '🔄'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fleet Status Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Fleet Status</Text>

          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>🚗</Text>
              <Text style={styles.statusLabel}>Total Vehicles</Text>
              <Text style={styles.statusValue}>{analytics.total_vehicles}</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>✓</Text>
              <Text style={styles.statusLabel}>Active Vehicles</Text>
              <Text style={styles.statusValue}>{analytics.active_vehicles}</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>👤</Text>
              <Text style={styles.statusLabel}>Total Drivers</Text>
              <Text style={styles.statusValue}>{analytics.total_drivers}</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>✓</Text>
              <Text style={styles.statusLabel}>Active Drivers</Text>
              <Text style={styles.statusValue}>{analytics.active_drivers}</Text>
            </View>
          </View>
        </View>

        {/* Daily Performance */}
        <View style={styles.performanceCard}>
          <Text style={styles.cardTitle}>Today's Performance</Text>

          <View style={styles.performanceRow}>
            <View style={styles.perfItem}>
              <Text style={styles.perfLabel}>Active Trips</Text>
              <Text style={styles.perfValue}>{analytics.daily_active_trips}</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={styles.perfLabel}>Completed</Text>
              <Text style={styles.perfValue}>{analytics.daily_completed_trips}</Text>
            </View>
          </View>

          <View style={styles.performanceRow}>
            <View style={styles.perfItem}>
              <Text style={styles.perfLabel}>Distance</Text>
              <Text style={styles.perfValue}>{analytics.total_distance_covered.toFixed(0)} km</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={styles.perfLabel}>Utilization</Text>
              <Text style={styles.perfValue}>{analytics.fleet_utilization.toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.cardTitle}>💰 Financial Summary</Text>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Daily Revenue</Text>
            <Text style={[styles.finValue, { color: '#10b981' }]}>
              {formatCurrency(analytics.daily_revenue)}
            </Text>
          </View>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Daily Costs</Text>
            <Text style={[styles.finValue, { color: '#ef4444' }]}>
              {formatCurrency(analytics.daily_costs)}
            </Text>
          </View>

          <View style={[styles.finRow, styles.profitRow]}>
            <Text style={styles.finLabel}>Daily Profit</Text>
            <Text style={[styles.finValue, { color: '#2563eb', fontWeight: 'bold' }]}>
              {formatCurrency(analytics.daily_profit)}
            </Text>
          </View>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Profit Margin</Text>
            <Text style={styles.finValue}>{profitMargin}%</Text>
          </View>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Cost per KM</Text>
            <Text style={styles.finValue}>PKR {analytics.cost_per_km.toFixed(2)}</Text>
          </View>
        </View>

        {/* Quality Metrics */}
        <View style={styles.qualityCard}>
          <Text style={styles.cardTitle}>⭐ Quality Metrics</Text>

          <View style={styles.metricRow}>
            <View style={styles.metricBar}>
              <Text style={styles.metricLabel}>Fleet Rating</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(analytics.average_fleet_rating / 5) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.metricScore}>
                {analytics.average_fleet_rating.toFixed(1)}/5.0
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricBar}>
              <Text style={styles.metricLabel}>On-Time Performance</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${analytics.on_time_performance}%` },
                  ]}
                />
              </View>
              <Text style={styles.metricScore}>{analytics.on_time_performance.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Trip Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>📊 Trip Statistics</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Trips (Today)</Text>
            <Text style={styles.statValue}>{analytics.daily_active_trips}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Completion Rate</Text>
            <Text style={styles.statValue}>
              {(
                (analytics.daily_completed_trips / analytics.daily_active_trips) *
                100
              ).toFixed(0)}
              %
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Distance</Text>
            <Text style={styles.statValue}>{analytics.total_distance_covered.toFixed(0)} km</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg Distance/Trip</Text>
            <Text style={styles.statValue}>
              {(analytics.total_distance_covered / analytics.daily_completed_trips).toFixed(1)} km
            </Text>
          </View>
        </View>

        {/* Insights & Recommendations */}
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>💡 Insights & Recommendations</Text>

          {analytics.fleet_utilization < 50 && (
            <View style={styles.insight}>
              <Text style={styles.insightIcon}>⚠️</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Low Utilization</Text>
                <Text style={styles.insightDesc}>
                  Fleet utilization is below target. Consider optimizing routes or scheduling.
                </Text>
              </View>
            </View>
          )}

          {analytics.on_time_performance < 80 && (
            <View style={styles.insight}>
              <Text style={styles.insightIcon}>⏰</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>On-Time Issues</Text>
                <Text style={styles.insightDesc}>
                  On-time performance below 80%. Review traffic patterns and driver assignments.
                </Text>
              </View>
            </View>
          )}

          {profitMargin < 20 && (
            <View style={styles.insight}>
              <Text style={styles.insightIcon}>💰</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Low Profit Margin</Text>
                <Text style={styles.insightDesc}>
                  Profit margin below target. Review operational costs and pricing.
                </Text>
              </View>
            </View>
          )}

          {analytics.average_fleet_rating < 4.0 && (
            <View style={styles.insight}>
              <Text style={styles.insightIcon}>⭐</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Rating Concerns</Text>
                <Text style={styles.insightDesc}>
                  Average rating below target. Focus on driver training and customer service.
                </Text>
              </View>
            </View>
          )}

          {analytics.fleet_utilization >= 50 &&
            analytics.on_time_performance >= 80 &&
            profitMargin >= 20 &&
            analytics.average_fleet_rating >= 4.0 && (
              <View style={styles.insightGood}>
                <Text style={styles.insightIcon}>🎯</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Excellent Performance</Text>
                  <Text style={styles.insightDesc}>
                    All metrics are within target ranges. Fleet is performing optimally.
                  </Text>
                </View>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  refreshIcon: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  performanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  perfItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
  },
  perfLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  perfValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  financialCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  profitRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  finLabel: {
    fontSize: 13,
    color: '#166534',
  },
  finValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  qualityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricRow: {
    marginBottom: 16,
  },
  metricBar: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  metricScore: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  insight: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  insightGood: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  insightDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default FleetAnalyticsDashboard;
