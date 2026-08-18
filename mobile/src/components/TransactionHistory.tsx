import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { usePaymentsStore } from '../store/paymentsStore';
import type { Transaction } from '../store/paymentsStore';

interface TransactionHistoryProps {
  driverId: number;
  onClose: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  driverId,
  onClose,
}) => {
  const { getTransactionHistory } = usePaymentsStore();
  const transactions = useMemo(() => getTransactionHistory(driverId, 50), [driverId, getTransactionHistory]);

  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === 'completed');
    const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = completed.reduce((sum, t) => sum + (t.fee || 0), 0);

    return {
      totalAmount,
      totalFees,
      netAmount: totalAmount - totalFees,
      transactionCount: completed.length,
    };
  }, [transactions]);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return '💳';
      case 'jazzcash':
        return '📱';
      case 'easypaisa':
        return '📲';
      case 'bank':
        return '🏦';
      default:
        return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓ Completed';
      case 'processing':
        return '⟳ Processing';
      case 'pending':
        return '⏳ Pending';
      case 'failed':
        return '✕ Failed';
      default:
        return status;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <Text style={styles.providerIcon}>{getProviderIcon(item.payment_method.provider)}</Text>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDesc}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
          </Text>
          <Text style={[styles.statusBadge, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.amount,
            item.status === 'completed' ? styles.amountSuccess : styles.amountPending,
          ]}
        >
          PKR {item.amount.toFixed(0)}
        </Text>
        {item.fee && item.status === 'completed' && (
          <Text style={styles.feeText}>-{item.fee.toFixed(0)} fee</Text>
        )}
        {item.net_amount && item.status === 'completed' && (
          <Text style={styles.netAmount}>Net: {item.net_amount.toFixed(0)}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Transactions</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Sent</Text>
            <Text style={styles.statValue}>PKR {stats.totalAmount.toFixed(0)}</Text>
            <Text style={styles.statSubtext}>{stats.transactionCount} transactions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Fees</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              -PKR {stats.totalFees.toFixed(0)}
            </Text>
            <Text style={styles.statSubtext}>Payment costs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Net Received</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              PKR {stats.netAmount.toFixed(0)}
            </Text>
            <Text style={styles.statSubtext}>After fees</Text>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💤</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>💳</Text>
            <Text style={styles.legendText}>Credit/Debit Card (Stripe) - 2% fee</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>📱</Text>
            <Text style={styles.legendText}>JazzCash - 2.5% fee</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>📲</Text>
            <Text style={styles.legendText}>EasyPaisa - 2.5% fee</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🏦</Text>
            <Text style={styles.legendText}>Bank Transfer - No fee</Text>
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
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  listContainer: {
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
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  amountSuccess: {
    color: '#10b981',
  },
  amountPending: {
    color: '#f59e0b',
  },
  feeText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 2,
  },
  netAmount: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  legendCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legendIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
});

export default TransactionHistory;
