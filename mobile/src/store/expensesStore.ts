import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Expense {
  id: string;
  trip_id?: number;
  driver_id: number;
  type: 'fuel' | 'toll' | 'parking' | 'maintenance' | 'food' | 'other';
  amount: number;
  currency: string;
  description: string;
  receipt_photo_uri?: string;
  created_at: number;
  approved: boolean;
  approved_by?: string;
  notes?: string;
}

export interface FuelEntry {
  id: string;
  driver_id: number;
  date: number;
  liters: number;
  cost: number;
  fuel_type: 'petrol' | 'diesel' | 'cng';
  odometer_reading: number;
  station_name?: string;
  receipt_photo_uri?: string;
  notes?: string;
}

export interface DailySummary {
  date: number;
  driver_id: number;
  trips_completed: number;
  trips_earnings: number;
  fuel_expenses: number;
  other_expenses: number;
  gross_earnings: number;
  net_earnings: number;
  total_km: number;
  avg_km_per_liter?: number;
}

export interface EarningsReport {
  period: 'daily' | 'weekly' | 'monthly';
  start_date: number;
  end_date: number;
  driver_id: number;
  total_trips: number;
  gross_earnings: number;
  total_expenses: number;
  net_earnings: number;
  bonuses: number;
  deductions: number;
  final_earnings: number;
}

interface ExpensesStore {
  expenses: Expense[];
  fuelEntries: FuelEntry[];
  dailySummaries: DailySummary[];
  selectedDate: number;

  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  addFuelEntry: (entry: Omit<FuelEntry, 'id'>) => void;
  approveExpense: (expenseId: string, approvedBy: string) => void;
  getDailySummary: (date: number, driverId: number) => DailySummary | null;
  getEarningsReport: (
    period: 'daily' | 'weekly' | 'monthly',
    driverId: number
  ) => EarningsReport;
  calculateDailySummary: (date: number, driverId: number) => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useExpensesStore = create<ExpensesStore>((set, get) => ({
  expenses: [],
  fuelEntries: [],
  dailySummaries: [],
  selectedDate: Date.now(),

  addExpense: (expense) => {
    const newExpense: Expense = {
      ...expense,
      id: `${Date.now()}_${Math.random()}`,
      created_at: Date.now(),
    };
    const expenses = get().expenses;
    set({ expenses: [...expenses, newExpense] });
    get().calculateDailySummary(expense.created_at || Date.now(), expense.driver_id);
    get().saveToStorage();
  },

  addFuelEntry: (entry) => {
    const newEntry: FuelEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random()}`,
    };
    const fuelEntries = get().fuelEntries;
    set({ fuelEntries: [...fuelEntries, newEntry] });
    get().calculateDailySummary(entry.date, entry.driver_id);
    get().saveToStorage();
  },

  approveExpense: (expenseId: string, approvedBy: string) => {
    const expenses = get().expenses.map((exp) =>
      exp.id === expenseId ? { ...exp, approved: true, approved_by: approvedBy } : exp
    );
    set({ expenses });
    get().saveToStorage();
  },

  getDailySummary: (date: number, driverId: number) => {
    const summaries = get().dailySummaries;
    const dateKey = new Date(date).toDateString();
    return (
      summaries.find((s) => new Date(s.date).toDateString() === dateKey && s.driver_id === driverId) ||
      null
    );
  },

  getEarningsReport: (period: 'daily' | 'weekly' | 'monthly', driverId: number) => {
    const summaries = get().dailySummaries.filter((s) => s.driver_id === driverId);
    const now = Date.now();
    let start_date = now;
    let end_date = now;

    if (period === 'daily') {
      start_date = new Date(now).setHours(0, 0, 0, 0);
      end_date = new Date(now).setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      const week = new Date(now);
      start_date = new Date(week.setDate(week.getDate() - week.getDay())).getTime();
      end_date = new Date(week.setDate(week.getDate() + 6)).getTime();
    } else if (period === 'monthly') {
      const month = new Date(now);
      start_date = new Date(month.getFullYear(), month.getMonth(), 1).getTime();
      end_date = new Date(month.getFullYear(), month.getMonth() + 1, 0).getTime();
    }

    const relevantSummaries = summaries.filter(
      (s) => s.date >= start_date && s.date <= end_date
    );

    const totals = relevantSummaries.reduce(
      (acc, s) => ({
        trips: acc.trips + s.trips_completed,
        gross: acc.gross + s.trips_earnings,
        expenses: acc.expenses + (s.fuel_expenses + s.other_expenses),
        net: acc.net + s.net_earnings,
      }),
      { trips: 0, gross: 0, expenses: 0, net: 0 }
    );

    return {
      period,
      start_date,
      end_date,
      driver_id: driverId,
      total_trips: totals.trips,
      gross_earnings: totals.gross,
      total_expenses: totals.expenses,
      net_earnings: totals.net,
      bonuses: Math.max(0, totals.trips * 500), // Bonus: 500 PKR per trip
      deductions: 0,
      final_earnings: totals.net + Math.max(0, totals.trips * 500),
    };
  },

  calculateDailySummary: (date: number, driverId: number) => {
    const expenses = get().expenses.filter(
      (e) => new Date(e.created_at).toDateString() === new Date(date).toDateString() &&
             e.driver_id === driverId
    );
    const fuelEntries = get().fuelEntries.filter(
      (f) => new Date(f.date).toDateString() === new Date(date).toDateString() &&
             f.driver_id === driverId
    );

    const fuelExpenses = fuelEntries.reduce((sum, f) => sum + f.cost, 0);
    const otherExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const tripsEarnings = expenses
      .filter((e) => e.trip_id)
      .reduce((sum, e) => sum + e.amount, 0) || 2500; // Mock: avg trip earnings

    const summary: DailySummary = {
      date: new Date(date).setHours(0, 0, 0, 0),
      driver_id: driverId,
      trips_completed: expenses.filter((e) => e.trip_id).length || 5,
      trips_earnings: tripsEarnings,
      fuel_expenses: fuelExpenses,
      other_expenses: otherExpenses,
      gross_earnings: tripsEarnings,
      net_earnings: tripsEarnings - fuelExpenses - otherExpenses,
      total_km: fuelEntries.reduce((sum, f) => sum + (f.odometer_reading || 0), 0),
      avg_km_per_liter: fuelEntries.length > 0
        ? fuelEntries.reduce((sum, f) => sum + (f.odometer_reading || 0), 0) /
          fuelEntries.reduce((sum, f) => sum + f.liters, 0)
        : undefined,
    };

    const summaries = get().dailySummaries;
    const existingIndex = summaries.findIndex(
      (s) => s.date === summary.date && s.driver_id === driverId
    );

    if (existingIndex >= 0) {
      summaries[existingIndex] = summary;
    } else {
      summaries.push(summary);
    }

    set({ dailySummaries: summaries });
  },

  saveToStorage: async () => {
    try {
      const { expenses, fuelEntries, dailySummaries } = get();
      await AsyncStorage.setItem('expenses', JSON.stringify(expenses));
      await AsyncStorage.setItem('fuelEntries', JSON.stringify(fuelEntries));
      await AsyncStorage.setItem('dailySummaries', JSON.stringify(dailySummaries));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      const [expensesJson, fuelEntriesJson, summariesJson] = await Promise.all([
        AsyncStorage.getItem('expenses'),
        AsyncStorage.getItem('fuelEntries'),
        AsyncStorage.getItem('dailySummaries'),
      ]);

      if (expensesJson) set({ expenses: JSON.parse(expensesJson) });
      if (fuelEntriesJson) set({ fuelEntries: JSON.parse(fuelEntriesJson) });
      if (summariesJson) set({ dailySummaries: JSON.parse(summariesJson) });
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  },
}));
