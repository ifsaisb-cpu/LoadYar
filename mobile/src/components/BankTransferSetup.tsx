import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { usePaymentsStore } from '../store/paymentsStore';
import type { BankAccount } from '../store/paymentsStore';

interface BankTransferSetupProps {
  driverId: number;
  onClose: () => void;
}

const BANKS = [
  'State Bank of Pakistan',
  'HBL',
  'UBL',
  'National Bank',
  'Habib Metropolitan',
  'Allied Bank',
  'MCB Bank',
  'Other',
];

const ACCOUNT_TYPES = ['checking', 'savings'] as const;

export const BankTransferSetup: React.FC<BankTransferSetupProps> = ({
  driverId,
  onClose,
}) => {
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');

  const { addBankAccount, bankAccounts } = usePaymentsStore();

  const handleAddBank = () => {
    if (!bankName || !accountHolder || !accountNumber) {
      Alert.alert('Error', 'Please fill in bank, account holder, and account number');
      return;
    }

    const newAccount: Omit<BankAccount, 'id' | 'created_at'> = {
      bank_name: bankName,
      account_holder_name: accountHolder,
      account_number: accountNumber,
      iban: iban || undefined,
      swift_code: swiftCode || undefined,
      account_type: accountType,
      verified: false,
    };

    addBankAccount(newAccount);

    setBankName('');
    setAccountHolder('');
    setAccountNumber('');
    setIban('');
    setSwiftCode('');

    Alert.alert('Success', 'Bank account added. Verification code sent via SMS.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏦 Bank Transfer</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Add your bank account for direct deposits. Transfers are processed within 1-2 business days.
          </Text>
        </View>

        {/* Bank Selection */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Select Bank</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bankList}
          >
            {BANKS.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={[
                  styles.bankButton,
                  bankName === bank && styles.bankButtonSelected,
                ]}
                onPress={() => setBankName(bank)}
              >
                <Text
                  style={[
                    styles.bankButtonText,
                    bankName === bank && styles.bankButtonTextSelected,
                  ]}
                >
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={accountHolder}
              onChangeText={setAccountHolder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="16-24 digit account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IBAN (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="International Bank Account Number"
              value={iban}
              onChangeText={setIban}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SWIFT Code (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Bank SWIFT code"
              value={swiftCode}
              onChangeText={setSwiftCode}
            />
          </View>

          {/* Account Type */}
          <View style={styles.typeContainer}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.typeButtons}>
              {ACCOUNT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    accountType === type && styles.typeButtonSelected,
                  ]}
                  onPress={() => setAccountType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      accountType === type && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddBank}>
            <Text style={styles.addButtonText}>+ Add Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* Added Accounts */}
        {bankAccounts.length > 0 && (
          <View style={styles.accountsCard}>
            <Text style={styles.sectionTitle}>Saved Accounts</Text>
            {bankAccounts.map((account) => (
              <View key={account.id} style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountBank}>{account.bank_name}</Text>
                  <Text style={styles.accountNumber}>
                    ••••{account.account_number.slice(-4)}
                  </Text>
                  {account.verified && (
                    <Text style={styles.verifiedBadge}>✓ Verified</Text>
                  )}
                  {!account.verified && (
                    <Text style={styles.pendingBadge}>⏳ Pending Verification</Text>
                  )}
                </View>
              </View>
            ))}
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
  infoCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  bankList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bankButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#e0f2fe',
  },
  bankButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bankButtonTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#e0f2fe',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  accountsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountInfo: {
    flex: 1,
  },
  accountBank: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  accountNumber: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '500',
  },
  pendingBadge: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default BankTransferSetup;
