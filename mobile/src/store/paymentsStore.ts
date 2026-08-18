import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
  provider: 'stripe' | 'jazzcash' | 'easypaisa' | 'bank';
  last_four?: string;
  account_holder?: string;
  account_number?: string;
  bank_name?: string;
  iban?: string;
  is_default: boolean;
  verified: boolean;
  created_at: number;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban?: string;
  swift_code?: string;
  branch_code?: string;
  account_type: 'checking' | 'savings';
  verified: boolean;
  verification_code?: string;
  created_at: number;
}

export interface Transaction {
  id: string;
  driver_id: number;
  type: 'payment' | 'withdrawal' | 'refund';
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  gateway_transaction_id?: string;
  description: string;
  fee?: number;
  net_amount?: number;
  created_at: number;
  completed_at?: number;
  error_message?: string;
}

export interface PaymentReconciliation {
  id: string;
  driver_id: number;
  period_start: number;
  period_end: number;
  total_earnings: number;
  total_payments: number;
  total_fees: number;
  net_balance: number;
  reconciliation_status: 'pending' | 'reconciled' | 'disputed';
  created_at: number;
}

interface PaymentsStore {
  paymentMethods: PaymentMethod[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  reconciliations: PaymentReconciliation[];
  selectedMethod: PaymentMethod | null;

  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'created_at'>) => void;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'created_at'>) => void;
  setDefaultPaymentMethod: (methodId: string) => void;
  processPayment: (amount: number, method: PaymentMethod, description: string) => Promise<Transaction>;
  recordTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  processStripePayment: (amount: number, methodId: string) => Promise<string>;
  processJazzCashPayment: (amount: number, phone: string) => Promise<string>;
  processEasyPaisaPayment: (amount: number, accountId: string) => Promise<string>;
  processBankTransfer: (amount: number, bankAccountId: string) => Promise<string>;
  getTransactionHistory: (driverId: number, limit?: number) => Transaction[];
  generateReconciliation: (driverId: number, startDate: number, endDate: number) => PaymentReconciliation;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const usePaymentsStore = create<PaymentsStore>((set, get) => ({
  paymentMethods: [],
  bankAccounts: [],
  transactions: [],
  reconciliations: [],
  selectedMethod: null,

  addPaymentMethod: (method) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: `${Date.now()}_${Math.random()}`,
      created_at: Date.now(),
    };
    const methods = get().paymentMethods;
    if (method.is_default) {
      methods.forEach((m) => (m.is_default = false));
    }
    set({ paymentMethods: [...methods, newMethod], selectedMethod: newMethod });
    get().saveToStorage();
  },

  addBankAccount: (account) => {
    const newAccount: BankAccount = {
      ...account,
      id: `${Date.now()}_${Math.random()}`,
      created_at: Date.now(),
    };
    const accounts = get().bankAccounts;
    set({ bankAccounts: [...accounts, newAccount] });
    get().saveToStorage();
  },

  setDefaultPaymentMethod: (methodId: string) => {
    const methods = get().paymentMethods.map((m) =>
      m.id === methodId ? { ...m, is_default: true } : { ...m, is_default: false }
    );
    const selected = methods.find((m) => m.id === methodId) || null;
    set({ paymentMethods: methods, selectedMethod: selected });
    get().saveToStorage();
  },

  processPayment: async (amount: number, method: PaymentMethod, description: string) => {
    const transaction: Transaction = {
      id: `${Date.now()}_${Math.random()}`,
      driver_id: 1, // Mock
      type: 'payment',
      amount,
      currency: 'PKR',
      payment_method: method,
      status: 'processing',
      description,
      created_at: Date.now(),
    };

    get().recordTransaction(transaction);

    try {
      let gateway_transaction_id = '';
      let fee = amount * 0.02; // 2% fee default

      if (method.provider === 'stripe') {
        gateway_transaction_id = await get().processStripePayment(amount, method.id);
      } else if (method.provider === 'jazzcash') {
        gateway_transaction_id = await get().processJazzCashPayment(amount, method.last_four || '');
        fee = amount * 0.025; // 2.5% fee
      } else if (method.provider === 'easypaisa') {
        gateway_transaction_id = await get().processEasyPaisaPayment(amount, method.id);
        fee = amount * 0.025; // 2.5% fee
      } else if (method.provider === 'bank') {
        gateway_transaction_id = await get().processBankTransfer(amount, method.id);
        fee = 0; // No fee for bank transfers
      }

      const completed: Transaction = {
        ...transaction,
        status: 'completed',
        gateway_transaction_id,
        fee,
        net_amount: amount - fee,
        completed_at: Date.now(),
      };

      const transactions = get().transactions.map((t) =>
        t.id === transaction.id ? completed : t
      );
      set({ transactions });
      get().saveToStorage();

      return completed;
    } catch (error) {
      const failed: Transaction = {
        ...transaction,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
      const transactions = get().transactions.map((t) =>
        t.id === transaction.id ? failed : t
      );
      set({ transactions });
      get().saveToStorage();
      throw error;
    }
  },

  recordTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}_${Math.random()}`,
      created_at: Date.now(),
    };
    const transactions = get().transactions;
    set({ transactions: [...transactions, newTransaction] });
  },

  processStripePayment: async (amount: number, methodId: string) => {
    // Mock Stripe API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }, 1000);
    });
  },

  processJazzCashPayment: async (amount: number, phone: string) => {
    // Mock JazzCash API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`jz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }, 1500);
    });
  },

  processEasyPaisaPayment: async (amount: number, accountId: string) => {
    // Mock EasyPaisa API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }, 1500);
    });
  },

  processBankTransfer: async (amount: number, bankAccountId: string) => {
    // Mock Bank Transfer API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }, 2000);
    });
  },

  getTransactionHistory: (driverId: number, limit = 20) => {
    const transactions = get().transactions.filter((t) => t.driver_id === driverId);
    return transactions.slice(-limit).reverse();
  },

  generateReconciliation: (driverId: number, startDate: number, endDate: number) => {
    const transactions = get().transactions.filter(
      (t) => t.driver_id === driverId && t.created_at >= startDate && t.created_at <= endDate
    );

    const total_earnings = transactions
      .filter((t) => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const total_fees = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);

    const reconciliation: PaymentReconciliation = {
      id: `${Date.now()}_${Math.random()}`,
      driver_id: driverId,
      period_start: startDate,
      period_end: endDate,
      total_earnings,
      total_payments: transactions.filter((t) => t.type === 'withdrawal').length,
      total_fees,
      net_balance: total_earnings - total_fees,
      reconciliation_status: 'reconciled',
      created_at: Date.now(),
    };

    const reconciliations = get().reconciliations;
    set({ reconciliations: [...reconciliations, reconciliation] });
    get().saveToStorage();

    return reconciliation;
  },

  saveToStorage: async () => {
    try {
      const { paymentMethods, bankAccounts, transactions, reconciliations } = get();
      await Promise.all([
        AsyncStorage.setItem('paymentMethods', JSON.stringify(paymentMethods)),
        AsyncStorage.setItem('bankAccounts', JSON.stringify(bankAccounts)),
        AsyncStorage.setItem('transactions', JSON.stringify(transactions)),
        AsyncStorage.setItem('reconciliations', JSON.stringify(reconciliations)),
      ]);
    } catch (error) {
      console.error('Failed to save payments:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      const [methodsJson, accountsJson, transJson, reconJson] = await Promise.all([
        AsyncStorage.getItem('paymentMethods'),
        AsyncStorage.getItem('bankAccounts'),
        AsyncStorage.getItem('transactions'),
        AsyncStorage.getItem('reconciliations'),
      ]);

      if (methodsJson) set({ paymentMethods: JSON.parse(methodsJson) });
      if (accountsJson) set({ bankAccounts: JSON.parse(accountsJson) });
      if (transJson) set({ transactions: JSON.parse(transJson) });
      if (reconJson) set({ reconciliations: JSON.parse(reconJson) });
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  },
}));
