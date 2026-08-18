import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { usePaymentsStore } from '../store/paymentsStore';
import type { PaymentMethod } from '../store/paymentsStore';

interface PaymentMethodSelectorProps {
  onMethodSelected: (method: PaymentMethod) => void;
  onClose: () => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodSelected,
  onClose,
}) => {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'card' | 'jazzcash' | 'easypaisa' | 'bank_transfer'>('card');

  const { paymentMethods, bankAccounts, addPaymentMethod, setDefaultPaymentMethod } = usePaymentsStore();

  const handleSelectMethod = (method: PaymentMethod) => {
    onMethodSelected(method);
    onClose();
  };

  const handleAddCard = () => {
    const newCard: Omit<PaymentMethod, 'id' | 'created_at'> = {
      type: 'card',
      provider: 'stripe',
      last_four: `${Math.floor(Math.random() * 9000) + 1000}`,
      is_default: paymentMethods.length === 0,
      verified: false,
    };
    addPaymentMethod(newCard);
    Alert.alert('Success', 'Card added. Verify with a test transaction.');
    setShowAddNew(false);
  };

  const handleAddJazzCash = () => {
    const newMethod: Omit<PaymentMethod, 'id' | 'created_at'> = {
      type: 'jazzcash',
      provider: 'jazzcash',
      account_holder: 'Your Name',
      is_default: paymentMethods.length === 0,
      verified: false,
    };
    addPaymentMethod(newMethod);
    Alert.alert('Success', 'JazzCash account linked.');
    setShowAddNew(false);
  };

  const handleAddEasyPaisa = () => {
    const newMethod: Omit<PaymentMethod, 'id' | 'created_at'> = {
      type: 'easypaisa',
      provider: 'easypaisa',
      account_holder: 'Your Name',
      is_default: paymentMethods.length === 0,
      verified: false,
    };
    addPaymentMethod(newMethod);
    Alert.alert('Success', 'EasyPaisa account linked.');
    setShowAddNew(false);
  };

  const handleAddBank = () => {
    if (bankAccounts.length === 0) {
      Alert.alert('No Bank Accounts', 'Please add a bank account first.');
      return;
    }

    const bankAccount = bankAccounts[0];
    const newMethod: Omit<PaymentMethod, 'id' | 'created_at'> = {
      type: 'bank_transfer',
      provider: 'bank',
      bank_name: bankAccount.bank_name,
      account_number: bankAccount.account_number,
      account_holder: bankAccount.account_holder_name,
      is_default: paymentMethods.length === 0,
      verified: bankAccount.verified,
    };
    addPaymentMethod(newMethod);
    Alert.alert('Success', 'Bank account linked for transfers.');
    setShowAddNew(false);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>💳 Payment Methods</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Existing Methods */}
          {paymentMethods.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Your Payments Methods</Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    method.is_default && styles.methodCardDefault,
                  ]}
                  onPress={() => handleSelectMethod(method)}
                >
                  <View style={styles.methodIcon}>
                    {method.provider === 'stripe' && <Text style={styles.icon}>💳</Text>}
                    {method.provider === 'jazzcash' && <Text style={styles.icon}>📱</Text>}
                    {method.provider === 'easypaisa' && <Text style={styles.icon}>📲</Text>}
                    {method.provider === 'bank' && <Text style={styles.icon}>🏦</Text>}
                  </View>

                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>
                      {method.provider === 'stripe' && `Card ••••${method.last_four}`}
                      {method.provider === 'jazzcash' && 'JazzCash'}
                      {method.provider === 'easypaisa' && 'EasyPaisa'}
                      {method.provider === 'bank' && `${method.bank_name}`}
                    </Text>
                    <View style={styles.methodStatus}>
                      {method.verified ? (
                        <Text style={styles.verifiedStatus}>✓ Verified</Text>
                      ) : (
                        <Text style={styles.unverifiedStatus}>⏳ Unverified</Text>
                      )}
                      {method.is_default && (
                        <Text style={styles.defaultBadge}>Default</Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (!method.is_default) {
                        setDefaultPaymentMethod(method.id);
                        Alert.alert('Updated', 'Default payment method changed.');
                      }
                    }}
                  >
                    <Text style={styles.selectButton}>
                      {method.is_default ? '✓' : 'Set Default'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add New Method */}
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Add New Method</Text>

            <TouchableOpacity
              style={styles.addMethodButton}
              onPress={() => {
                setNewMethodType('card');
                setShowAddNew(true);
              }}
            >
              <Text style={styles.addIcon}>💳</Text>
              <View style={styles.addMethodText}>
                <Text style={styles.addMethodTitle}>Credit/Debit Card</Text>
                <Text style={styles.addMethodDesc}>Stripe secured payment</Text>
              </View>
              <Text style={styles.addArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMethodButton}
              onPress={() => {
                setNewMethodType('jazzcash');
                setShowAddNew(true);
              }}
            >
              <Text style={styles.addIcon}>📱</Text>
              <View style={styles.addMethodText}>
                <Text style={styles.addMethodTitle}>JazzCash</Text>
                <Text style={styles.addMethodDesc}>Mobile wallet transfer</Text>
              </View>
              <Text style={styles.addArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMethodButton}
              onPress={() => {
                setNewMethodType('easypaisa');
                setShowAddNew(true);
              }}
            >
              <Text style={styles.addIcon}>📲</Text>
              <View style={styles.addMethodText}>
                <Text style={styles.addMethodTitle}>EasyPaisa</Text>
                <Text style={styles.addMethodDesc}>Mobile payment account</Text>
              </View>
              <Text style={styles.addArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMethodButton}
              onPress={() => {
                setNewMethodType('bank_transfer');
                setShowAddNew(true);
              }}
            >
              <Text style={styles.addIcon}>🏦</Text>
              <View style={styles.addMethodText}>
                <Text style={styles.addMethodTitle}>Bank Transfer</Text>
                <Text style={styles.addMethodDesc}>Direct bank deposit</Text>
              </View>
              <Text style={styles.addArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={showAddNew} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {newMethodType.replace(/_/g, ' ')}</Text>

            {newMethodType === 'card' && (
              <View>
                <Text style={styles.modalText}>
                  Your card information is securely processed by Stripe. Click below to add your card.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddCard}>
                  <Text style={styles.modalButtonText}>Add Card</Text>
                </TouchableOpacity>
              </View>
            )}

            {newMethodType === 'jazzcash' && (
              <View>
                <Text style={styles.modalText}>
                  Link your JazzCash account for quick wallet transfers.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddJazzCash}>
                  <Text style={styles.modalButtonText}>Link JazzCash</Text>
                </TouchableOpacity>
              </View>
            )}

            {newMethodType === 'easypaisa' && (
              <View>
                <Text style={styles.modalText}>
                  Connect your EasyPaisa account for seamless payments.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddEasyPaisa}>
                  <Text style={styles.modalButtonText}>Link EasyPaisa</Text>
                </TouchableOpacity>
              </View>
            )}

            {newMethodType === 'bank_transfer' && (
              <View>
                <Text style={styles.modalText}>
                  Link a bank account for direct deposits to your account.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddBank}>
                  <Text style={styles.modalButtonText}>Link Bank Account</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddNew(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 16,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodCardDefault: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  methodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  verifiedStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  unverifiedStatus: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  defaultBadge: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectButton: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  addSection: {
    marginBottom: 20,
  },
  addMethodButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  addMethodText: {
    flex: 1,
  },
  addMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addMethodDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  addArrow: {
    fontSize: 18,
    color: '#ccc',
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
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

export default PaymentMethodSelector;
