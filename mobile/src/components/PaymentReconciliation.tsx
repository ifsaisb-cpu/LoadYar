import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { usePaymentsStore } from '../store/paymentsStore';
import { useExpensesStore } from '../store/expensesStore';

interface PaymentReconciliationProps {
  driverId: number;
  onClose: () => void;
}

export const PaymentReconciliation: React.FC<PaymentReconciliationProps> = ({
  driverId,
  onClose,
}) => {
  const { generateReconciliation, reconciliations } = usePaymentsStore();
  const { getEarningsReport } = useExpensesStore();

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const monthlyEarnings = useMemo(() => getEarningsReport('monthly', driverId), [
    driverId,
    getEarningsReport,
  ]);

  const currentMonthReconciliation = useMemo(
    () =>
      reconciliations.find(
        (r) =>
          r.driver_id === driverId &&
          r.period_start >= currentMonth.getTime() &&
          r.period_end < nextMonth.getTime()
      ),
    [reconciliations, driverId, currentMonth, nextMonth]
  );

  const handleGenerateMonthlyReconciliation = () => {
    const recon = generateReconciliation(
      driverId,
      currentMonth.getTime(),
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime()
    );

    Alert.alert(
      'Reconciliation Generated',
      `Month: ${now.toLocaleDateString()}\nNet Balance: PKR ${recon.net_balance.toFixed(0)}`
    );
  };

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const previousReconciliation = reconciliations.find(
    (r) =>
      r.driver_id === driverId &&
      r.period_start >= previousMonthStart.getTime() &&
      r.period_end <= previousMonthEnd.getTime()
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Reconciliation</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Period Overview */}
        <View style={styles.periodCard}>
          <Text style={styles.periodTitle}>
            {now.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Earnings</Text>
              <Text style={styles.metricValue}>PKR {monthlyEarnings.gross_earnings.toFixed(0)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={[styles.metricValue, { color: '#ef4444' }]}>
                -{monthlyEarnings.total_expenses.toFixed(0)}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Bonuses</Text>
              <Text style={[styles.metricValue, { color: '#10b981' }]}>
                +{monthlyEarnings.bonuses.toFixed(0)}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Net Amount</Text>
              <Text style={[styles.metricValue, { color: '#2563eb', fontWeight: 'bold' }]}>
                PKR {monthlyEarnings.final_earnings.toFixed(0)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateMonthlyReconciliation}
          >
            <Text style={styles.generateButtonText}>Generate Monthly Reconciliation</Text>
          </TouchableOpacity>
        </View>

        {/* Reconciliation Details */}
        {currentMonthReconciliation ? (
          <View style={styles.reconcilationCard}>
            <Text style={styles.sectionTitle}>Reconciliation Summary</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Period</Text>
              <Text style={styles.detailValue}>
                {new Date(currentMonthReconciliation.period_start).toLocaleDateString()} -{' '}
                {new Date(currentMonthReconciliation.period_end).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Earnings</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>
                PKR {currentMonthReconciliation.total_earnings.toFixed(0)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Fees</Text>
              <Text style={[styles.detailValue, { color: '#ef4444' }]}>
                -PKR {currentMonthReconciliation.total_fees.toFixed(0)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Transactions</Text>
              <Text style={styles.detailValue}>{currentMonthReconciliation.total_payments}</Text>
            </View>

            <View style={[styles.detailRow, styles.finalRow]}>
              <Text style={styles.finalLabel}>Net Balance</Text>
              <Text style={styles.finalValue}>
                PKR {currentMonthReconciliation.net_balance.toFixed(0)}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text
                style={[
                  styles.statusBadge,
                  currentMonthReconciliation.reconciliation_status === 'reconciled'
                    ? styles.statusReconciled
                    : styles.statusPending,
                ]}
              >
                {currentMonthReconciliation.reconciliation_status === 'reconciled'
                  ? '✓ Reconciled'
                  : '⏳ Pending'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No reconciliation yet</Text>
            <Text style={styles.emptySubtext}>
              Generate a monthly reconciliation to see your complete earnings breakdown
            </Text>
          </View>
        )}

        {/* Previous Reconciliation */}
        {previousReconciliation && (
          <View style={styles.previousCard}>
            <Text style={styles.sectionTitle}>
              Previous Period ({previousMonthStart.toLocaleDateString('en-US', { month: 'short' })})
            </Text>

            <View style={styles.previousRow}>
              <Text style={styles.previousLabel}>Total Earnings</Text>
              <Text style={styles.previousValue}>
                PKR {previousReconciliation.total_earnings.toFixed(0)}
              </Text>
            </View>

            <View style={styles.previousRow}>
              <Text style={styles.previousLabel}>Expenses & Fees</Text>
              <Text style={[styles.previousValue, { color: '#ef4444' }]}>
                -PKR {(previousReconciliation.total_fees + previousReconciliation.total_fees).toFixed(0)}
              </Text>
            </View>

            <View style={[styles.previousRow, styles.previousFinal]}>
              <Text style={styles.previousLabel}>Net Received</Text>
              <Text style={[styles.previousValue, { color: '#10b981', fontWeight: 'bold' }]}>
                PKR {previousReconciliation.net_balance.toFixed(0)}
              </Text>
            </View>
          </View>
        )}

        {/* Fee Breakdown Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payment Method Fees</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeMethod}>💳 Credit/Debit Card</Text>
            <Text style={styles.feeAmount}>2%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeMethod}>📱 JazzCash</Text>
            <Text style={styles.feeAmount}>2.5%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeMethod}>📲 EasyPaisa</Text>
            <Text style={styles.feeAmount}>2.5%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeMethod}>🏦 Bank Transfer</Text>
            <Text style={styles.feeAmount}>No fee</Text>
          </View>
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
  content: {
    flex: 1,
    padding: 12,
  },
  periodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  generateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  reconcilationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  finalRow: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 0,
    paddingBottom: 12,
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  finalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusReconciled: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#fed7aa',
    color: '#92400e',
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  previousCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previousRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  previousLabel: {
    fontSize: 13,
    color: '#666',
  },
  previousValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  previousFinal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feeMethod: {
    fontSize: 13,
    color: '#666',
  },
  feeAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

export default PaymentReconciliation;
