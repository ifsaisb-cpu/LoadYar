import { create } from 'zustand';
import { expenseService, Expense } from '../services/expense';
import { apiClient } from '../services/api';

interface ExpensesState {
  // State
  expenses: Expense[];
  tripExpenses: { [tripId: number]: Expense[] };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchExpenses: () => Promise<void>;
  fetchTripExpenses: (tripId: number) => Promise<void>;
  createExpense: (expense: Partial<Expense>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getTripTotal: (tripId: number) => number;
  getTripExpensesByType: (tripId: number) => { [key: string]: number };
  clearTripExpenses: (tripId: number) => void;
  clearError: () => void;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  tripExpenses: {},
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/expenses');
      set({ expenses: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch expenses';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTripExpenses: async (tripId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/trips/${tripId}/expenses`);
      set((state) => ({
        tripExpenses: {
          ...state.tripExpenses,
          [tripId]: response.data,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch trip expenses';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createExpense: async (expense: Partial<Expense>) => {
    set({ isLoading: true, error: null });

    // Validate expense
    const validation = expenseService.validateExpense(expense);
    if (!validation.isValid) {
      set({
        error: validation.errors.join(', '),
        isLoading: false,
      });
      throw new Error(validation.errors.join(', '));
    }

    try {
      const response = await apiClient.post('/expenses', expense);
      const newExpense = response.data;

      set((state) => {
        const tripId = newExpense.trip_id;
        return {
          expenses: [...state.expenses, newExpense],
          tripExpenses: {
            ...state.tripExpenses,
            [tripId]: [...(state.tripExpenses[tripId] || []), newExpense],
          },
          isLoading: false,
        };
      });

      return newExpense;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create expense';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateExpense: async (id: string, updates: Partial<Expense>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.patch(`/expenses/${id}`, updates);
      const updatedExpense = response.data;

      set((state) => {
        const oldExpense = state.expenses.find((e) => e.id === id);
        const newTripExpenses = { ...state.tripExpenses };

        // Update trip expenses if trip_id changed
        if (
          oldExpense?.trip_id !== updatedExpense.trip_id &&
          oldExpense?.trip_id
        ) {
          newTripExpenses[oldExpense.trip_id] = newTripExpenses[
            oldExpense.trip_id
          ]?.filter((e) => e.id !== id);
        }

        const tripId = updatedExpense.trip_id;
        if (!newTripExpenses[tripId]) {
          newTripExpenses[tripId] = [];
        }
        const tripExpenseIndex = newTripExpenses[tripId]?.findIndex(
          (e) => e.id === id
        );
        if (tripExpenseIndex !== undefined && tripExpenseIndex >= 0) {
          newTripExpenses[tripId]![tripExpenseIndex] = updatedExpense;
        }

        return {
          expenses: state.expenses.map((e) => (e.id === id ? updatedExpense : e)),
          tripExpenses: newTripExpenses,
          isLoading: false,
        };
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update expense';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteExpense: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/expenses/${id}`);

      set((state) => {
        const expense = state.expenses.find((e) => e.id === id);
        const tripId = expense?.trip_id;

        return {
          expenses: state.expenses.filter((e) => e.id !== id),
          tripExpenses: {
            ...state.tripExpenses,
            ...(tripId && {
              [tripId]: state.tripExpenses[tripId]?.filter((e) => e.id !== id),
            }),
          },
          isLoading: false,
        };
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete expense';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getTripTotal: (tripId: number) => {
    const state = get();
    const expenses = state.tripExpenses[tripId] || [];
    return expenseService.calculateTotal(expenses);
  },

  getTripExpensesByType: (tripId: number) => {
    const state = get();
    const expenses = state.tripExpenses[tripId] || [];
    const totals = expenseService.calculateByType(expenses);

    // Convert paisa to rupees for display
    const display: { [key: string]: string } = {};
    Object.entries(totals).forEach(([type, amount]) => {
      display[type] = expenseService.formatAmount(amount);
    });

    return display;
  },

  clearTripExpenses: (tripId: number) => {
    set((state) => {
      const newTripExpenses = { ...state.tripExpenses };
      delete newTripExpenses[tripId];
      return { tripExpenses: newTripExpenses };
    });
  },

  clearError: () => set({ error: null }),
}));
