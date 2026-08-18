import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { usePaymentsStore } from '../store/paymentsStore';
import BankTransferSetup from '../components/BankTransferSetup';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import TransactionHistory from '../components/TransactionHistory';
import PaymentReconciliation from '../components/PaymentReconciliation';

const DRIVER_ID = 1; // Mock driver ID

type ScreenType = 'main' | 'bank' | 'methods' | 'history' | 'reconciliation';

export const PaymentScreen: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');

  const {
    paymentMethods,
    selectedMethod,
    processPayment,
    bankAccounts,
  } = usePaymentsStore();

  const handleRequestPayout = async () => {
    if (!requestAmount || !selectedMethod) {
      Alert.alert('Error', 'Please enter amount and select payment method');
      return;
    }

    try {
      const transaction = await processPayment(
        parseFloat(requestAmount),
        selectedMethod,
        'Driver Payout Request'
      );

      Alert.alert(
        'Payout Initiated',
        `Amount: PKR ${transaction.amount.toFixed(0)}\nFee: PKR ${(transaction.fee || 0).toFixed(0)}\nNet: PKR ${(transaction.net_amount || 0).toFixed(0)}\n\nTransaction: ${transaction.gateway_transaction_id}`
      );

      setRequestAmount('');
      setShowRequestModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process payout'
      );
    }
  };

  if (currentScreen === 'bank') {
    return <BankTransferSetup driverId={DRIVER_ID} onClose={() => setCurrentScreen('main')} />;
  }

  if (currentScreen === 'methods') {
    return (
      <PaymentMethodSelector
        onMethodSelected={(method) => {
          Alert.alert('Success', `${method.provider} selected as payment method`);
          setCurrentScreen('main');
        }}
        onClose={() => setCurrentScreen('main')}
      />
    );
  }

  if (currentScreen === 'history') {
    return <TransactionHistory driverId={DRIVER_ID} onClose={() => setCurrentScreen('main')} />;
  }

  if (currentScreen === 'reconciliation') {
    return (
      <PaymentReconciliation driverId={DRIVER_ID} onClose={() => setCurrentScreen('main')} />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💳 Payments</Text>
        <Text style={styles.subtitle}>Manage payouts & payment methods</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>PKR 15,750</Text>
          <Text style={styles.balanceSubtext}>Updated 2 hours ago</Text>

          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => setShowRequestModal(true)}
          >
            <Text style={styles.requestButtonText}>+ Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>PKR 45,200</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💸</Text>
            <Text style={styles.statLabel}>Paid Out</Text>
            <Text style={styles.statValue}>PKR 29,450</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🏦</Text>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>PKR 2,100</Text>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.methodCard}>
          <Text style={styles.sectionTitle}>Primary Payment Method</Text>

          {selectedMethod ? (
            <View style={styles.methodInfo}>
              <Text style={styles.methodIcon}>
                {selectedMethod.provider === 'stripe' && '💳'}
                {selectedMethod.provider === 'jazzcash' && '📱'}
                {selectedMethod.provider === 'easypaisa' && '📲'}
                {selectedMethod.provider === 'bank' && '🏦'}
              </Text>
              <View style={styles.methodDetails}>
                <Text style={styles.methodName}>
                  {selectedMethod.provider === 'stripe' && `Card ••••${selectedMethod.last_four}`}
                  {selectedMethod.provider === 'jazzcash' && 'JazzCash Account'}
                  {selectedMethod.provider === 'easypaisa' && 'EasyPaisa Account'}
                  {selectedMethod.provider === 'bank' && selectedMethod.bank_name}
                </Text>
                <Text style={styles.methodStatus}>
                  {selectedMethod.verified ? '✓ Verified' : '⏳ Pending Verification'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noMethodText}>No payment method selected</Text>
          )}

          <TouchableOpacity
            style={styles.changeMethodButton}
            onPress={() => setCurrentScreen('methods')}
          >
            <Text style={styles.changeMethodText}>
              {selectedMethod ? 'Change Method' : 'Select Method'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods List */}
        <View style={styles.methodsListCard}>
          <View style={styles.methodsHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <Text style={styles.methodCount}>{paymentMethods.length}</Text>
          </View>

          {paymentMethods.length > 0 ? (
            <View>
              {paymentMethods.slice(0, 3).map((method) => (
                <View key={method.id} style={styles.methodListItem}>
                  <Text style={styles.methodListIcon}>
                    {method.provider === 'stripe' && '💳'}
                    {method.provider === 'jazzcash' && '📱'}
                    {method.provider === 'easypaisa' && '📲'}
                    {method.provider === 'bank' && '🏦'}
                  </Text>
                  <View style={styles.methodListDetails}>
                    <Text style={styles.methodListName}>
                      {method.provider === 'stripe' && `Card ••••${method.last_four}`}
                      {method.provider === 'jazzcash' && 'JazzCash'}
                      {method.provider === 'easypaisa' && 'EasyPaisa'}
                      {method.provider === 'bank' && method.bank_name}
                    </Text>
                  </View>
                  <Text style={styles.methodListStatus}>
                    {method.verified ? '✓' : '⏳'}
                  </Text>
                </View>
              ))}

              {paymentMethods.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setCurrentScreen('methods')}
                >
                  <Text style={styles.viewAllText}>View All ({paymentMethods.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No payment methods added yet</Text>
          )}

          <TouchableOpacity
            style={styles.addMethodButton}
            onPress={() => setCurrentScreen('methods')}
          >
            <Text style={styles.addMethodButtonText}>+ Add Payment Method</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBankButton}
            onPress={() => setCurrentScreen('bank')}
          >
            <Text style={styles.addBankButtonText}>+ Add Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setCurrentScreen('history')}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={styles.actionTitle}>Transactions</Text>
            <Text style={styles.actionDesc}>View payment history</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setCurrentScreen('reconciliation')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Reconciliation</Text>
            <Text style={styles.actionDesc}>Monthly breakdown</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Accounts Section */}
        {bankAccounts.length > 0 && (
          <View style={styles.bankAccountsCard}>
            <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
            {bankAccounts.map((account) => (
              <View key={account.id} style={styles.bankAccountItem}>
                <Text style={styles.bankIcon}>🏦</Text>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{account.bank_name}</Text>
                  <Text style={styles.bankAccount}>
                    ••••{account.account_number.slice(-4)}
                  </Text>
                  <Text style={styles.bankType}>{account.account_type}</Text>
                </View>
                <Text style={styles.bankVerified}>
                  {account.verified ? '✓' : '⏳'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Fee Info */}
        <View style={styles.feeInfoCard}>
          <Text style={styles.feeInfoTitle}>💡 Payment Fees</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Credit/Debit Card (Stripe)</Text>
            <Text style={styles.feeValue}>2%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>JazzCash</Text>
            <Text style={styles.feeValue}>2.5%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>EasyPaisa</Text>
            <Text style={styles.feeValue}>2.5%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Bank Transfer</Text>
            <Text style={styles.feeValue}>FREE</Text>
          </View>
        </View>
      </ScrollView>

      {/* Request Payout Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount (PKR)</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>PKR</Text>
                <Text
                  style={styles.amountInput}
                  onLongPress={() => {
                    /* Handle amount input */
                  }}
                >
                  {requestAmount || '0'}
                </Text>
              </View>

              <View style={styles.presets}>
                {[5000, 10000, 15000, 20000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.presetButton}
                    onPress={() => setRequestAmount(amount.toString())}
                  >
                    <Text style={styles.presetButtonText}>PKR {amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedMethod && requestAmount && (
                <View style={styles.feeEstimate}>
                  <Text style={styles.feeEstimateLabel}>Fee Estimate</Text>
                  <Text style={styles.feeEstimateValue}>
                    -{(parseFloat(requestAmount) * 0.025).toFixed(0)} PKR
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleRequestPayout}
              >
                <Text style={styles.modalConfirmButtonText}>Request Payout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRequestModal(false);
                  setRequestAmount('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  balanceCard: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  requestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  methodCard: {
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
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 12,
  },
  methodIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  methodStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  noMethodText: {
    fontSize: 13,
    color: '#999',
    paddingVertical: 12,
    textAlign: 'center',
  },
  changeMethodButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  methodsListCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  methodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodCount: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  methodListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodListIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  methodListDetails: {
    flex: 1,
  },
  methodListName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  methodListStatus: {
    fontSize: 16,
    color: '#10b981',
  },
  viewAllButton: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  viewAllText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  addMethodButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  addMethodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  addBankButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBankButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  bankAccountsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bankAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bankIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bankAccount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bankType: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 2,
  },
  bankVerified: {
    fontSize: 16,
    color: '#10b981',
  },
  feeInfoCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  feeInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  feeLabel: {
    fontSize: 12,
    color: '#1a1a1a',
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  presetButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  feeEstimate: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  feeEstimateLabel: {
    fontSize: 12,
    color: '#856404',
  },
  feeEstimateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginTop: 4,
  },
  modalConfirmButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

export default PaymentScreen;
