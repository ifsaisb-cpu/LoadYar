export type ExpenseType = 'fuel' | 'toll' | 'driver_advance' | 'maintenance' | 'other';

export interface Expense {
  id?: string;
  trip_id: number;
  type: ExpenseType;
  amount_paisa: number;
  description: string;
  date: string;
  location?: string;
  receipt_reference?: string; // WhatsApp message reference or image
  created_at?: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
  deleted_at?: string | null;
}

export interface ExpenseCategory {
  type: ExpenseType;
  label_en: string;
  label_ur: string;
  icon: string;
  glAccount: string; // GL account code from chart of accounts
  color: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    type: 'fuel',
    label_en: 'Fuel',
    label_ur: 'ایندھن',
    icon: '⛽',
    glAccount: '6001',
    color: '#FF9800',
  },
  {
    type: 'toll',
    label_en: 'Toll & Tax',
    label_ur: 'ٹول اور ٹیکس',
    icon: '🛣️',
    glAccount: '6003',
    color: '#2196F3',
  },
  {
    type: 'driver_advance',
    label_en: 'Driver Advance',
    label_ur: 'ڈرائیور پیشگی',
    icon: '💰',
    glAccount: '6002',
    color: '#4CAF50',
  },
  {
    type: 'maintenance',
    label_en: 'Maintenance',
    label_ur: 'مرمت',
    icon: '🔧',
    glAccount: '6004',
    color: '#9C27B0',
  },
  {
    type: 'other',
    label_en: 'Other',
    label_ur: 'دیگر',
    icon: '📌',
    glAccount: '9999',
    color: '#607D8B',
  },
];

export class ExpenseService {
  getCategories(): ExpenseCategory[] {
    return EXPENSE_CATEGORIES;
  }

  getCategoryByType(type: ExpenseType): ExpenseCategory | undefined {
    return EXPENSE_CATEGORIES.find((cat) => cat.type === type);
  }

  calculateTotal(expenses: Expense[]): number {
    return expenses.reduce((sum, exp) => sum + exp.amount_paisa, 0);
  }

  calculateByType(expenses: Expense[]): { [key in ExpenseType]: number } {
    const totals: { [key in ExpenseType]: number } = {
      fuel: 0,
      toll: 0,
      driver_advance: 0,
      maintenance: 0,
      other: 0,
    };

    expenses.forEach((exp) => {
      totals[exp.type] += exp.amount_paisa;
    });

    return totals;
  }

  formatAmount(paisa: number): string {
    return `₨ ${(paisa / 100).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  validateExpense(expense: Partial<Expense>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!expense.trip_id) {
      errors.push('Trip ID is required');
    }

    if (!expense.type) {
      errors.push('Expense type is required');
    }

    if (!expense.amount_paisa || expense.amount_paisa <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!expense.description || expense.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!expense.date) {
      errors.push('Date is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  groupByType(expenses: Expense[]): { [key in ExpenseType]?: Expense[] } {
    const grouped: { [key in ExpenseType]?: Expense[] } = {};

    expenses.forEach((exp) => {
      if (!grouped[exp.type]) {
        grouped[exp.type] = [];
      }
      grouped[exp.type]!.push(exp);
    });

    return grouped;
  }

  groupByDate(expenses: Expense[]): { [key: string]: Expense[] } {
    const grouped: { [key: string]: Expense[] } = {};

    expenses.forEach((exp) => {
      const date = new Date(exp.date).toLocaleDateString('en-PK');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(exp);
    });

    return grouped;
  }
}

export const expenseService = new ExpenseService();
