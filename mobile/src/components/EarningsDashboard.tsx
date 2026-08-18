import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useExpensesStore } from '../store/expensesStore';

interface EarningsDashboardProps {
  driverId: number;
  onClose: () => void;
}

export const EarningsDashboard: React.FC<EarningsDashboardProps> = ({
  driverId,
  onClose,
}) => {
  const { getEarningsReport, getDailySummary } = useExpensesStore();

  const todayReport = useMemo(() => getEarningsReport('daily', driverId), [
    driverId,
    getEarningsReport,
  ]);

  const weeklyReport = useMemo(() => getEarningsReport('weekly', driverId), [
    driverId,
    getEarningsReport,
  ]);

  const monthlyReport = useMemo(() => getEarningsReport('monthly', driverId), [
    driverId,
    getEarningsReport,
  ]);

  const todaySummary = getDailySummary(Date.now(), driverId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💰 Earnings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Quick Stats */}
        <View style={styles.quickStatsCard}>
          <Text style={styles.cardTitle}>Today</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Trips</Text>
              <Text style={styles.statValue}>{todayReport.total_trips}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Gross</Text>
              <Text style={styles.statValue}>
                PKR {todayReport.gross_earnings.toFixed(0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                -PKR {todayReport.total_expenses.toFixed(0)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Net Earnings</Text>
            <Text style={styles.earningsValue}>
              PKR {todayReport.net_earnings.toFixed(0)}
            </Text>
          </View>

          <View style={styles.earningsRow}>
            <Text style={styles.bonusLabel}>+ Bonuses</Text>
            <Text style={[styles.earningsValue, { color: '#10b981' }]}>
              PKR {todayReport.bonuses.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.earningsRow, styles.finalRow]}>
            <Text style={styles.finalLabel}>Final Earnings</Text>
            <Text style={styles.finalValue}>
              PKR {todayReport.final_earnings.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.periodCard}>
          <Text style={styles.cardTitle}>📅 Weekly</Text>

          <View style={styles.periodRow}>
            <Text>Trips Completed</Text>
            <Text style={styles.periodValue}>{weeklyReport.total_trips}</Text>
          </View>

          <View style={styles.periodRow}>
            <Text>Gross Earnings</Text>
            <Text style={styles.periodValue}>
              PKR {weeklyReport.gross_earnings.toFixed(0)}
            </Text>
          </View>

          <View style={styles.periodRow}>
            <Text>Expenses</Text>
            <Text style={[styles.periodValue, { color: '#ef4444' }]}>
              -PKR {weeklyReport.total_expenses.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.periodRow, styles.finalPeriodRow]}>
            <Text style={{ fontWeight: '600' }}>Total Earnings</Text>
            <Text style={[styles.periodValue, { fontWeight: '600', color: '#10b981' }]}>
              PKR {weeklyReport.final_earnings.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={styles.periodCard}>
          <Text style={styles.cardTitle}>📊 Monthly</Text>

          <View style={styles.periodRow}>
            <Text>Trips Completed</Text>
            <Text style={styles.periodValue}>{monthlyReport.total_trips}</Text>
          </View>

          <View style={styles.periodRow}>
            <Text>Gross Earnings</Text>
            <Text style={styles.periodValue}>
              PKR {monthlyReport.gross_earnings.toFixed(0)}
            </Text>
          </View>

          <View style={styles.periodRow}>
            <Text>Expenses</Text>
            <Text style={[styles.periodValue, { color: '#ef4444' }]}>
              -PKR {monthlyReport.total_expenses.toFixed(0)}
            </Text>
          </View>

          <View style={[styles.periodRow, styles.finalPeriodRow]}>
            <Text style={{ fontWeight: '600' }}>Total Earnings</Text>
            <Text style={[styles.periodValue, { fontWeight: '600', color: '#10b981' }]}>
              PKR {monthlyReport.final_earnings.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Breakdown */}
        {todaySummary && (
          <View style={styles.breakdownCard}>
            <Text style={styles.cardTitle}>📈 Today's Breakdown</Text>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Trips Earnings</Text>
              <Text style={styles.breakdownValue}>
                PKR {todaySummary.trips_earnings.toFixed(0)}
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Fuel Expenses</Text>
              <Text style={styles.breakdownValue}>
                -PKR {todaySummary.fuel_expenses.toFixed(0)}
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Other Expenses</Text>
              <Text style={styles.breakdownValue}>
                -PKR {todaySummary.other_expenses.toFixed(0)}
              </Text>
            </View>

            {todaySummary.avg_km_per_liter && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Fuel Efficiency</Text>
                <Text style={styles.breakdownValue}>
                  {todaySummary.avg_km_per_liter.toFixed(1)} km/L
                </Text>
              </View>
            )}
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 12,
  },
  quickStatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  bonusLabel: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  finalRow: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  periodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  finalPeriodRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  breakdownCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

export default EarningsDashboard;
