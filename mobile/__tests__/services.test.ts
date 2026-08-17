import { checklistService, CHECKLIST_ITEMS } from '../src/services/checklist';
import { expenseService } from '../src/services/expense';
import { locationService } from '../src/services/location';

describe('Checklist Service', () => {
  describe('getChecklistItems', () => {
    it('should return all 28 items', () => {
      const items = checklistService.getChecklistItems();
      expect(items).toHaveLength(28);
    });

    it('should have 5 categories', () => {
      const items = checklistService.getChecklistItems();
      const categories = new Set(items.map((i) => i.category));
      expect(categories.size).toBe(5);
      expect(Array.from(categories)).toEqual(
        expect.arrayContaining([
          'exterior',
          'interior',
          'mechanical',
          'safety',
          'documentation',
        ])
      );
    });
  });

  describe('getItemsByCategory', () => {
    it('should return only items from specified category', () => {
      const exterior = checklistService.getItemsByCategory('exterior');
      expect(exterior.every((i) => i.category === 'exterior')).toBe(true);
      expect(exterior.length).toBe(5);
    });

    it('should return empty array for non-existent category', () => {
      const items = checklistService.getItemsByCategory('invalid' as any);
      expect(items).toHaveLength(0);
    });
  });

  describe('getRequiredItems', () => {
    it('should return only required items', () => {
      const required = checklistService.getRequiredItems();
      expect(required.every((i) => i.required === true)).toBe(true);
    });

    it('should have at least 20 required items', () => {
      const required = checklistService.getRequiredItems();
      expect(required.length).toBeGreaterThan(20);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const items = checklistService.getChecklistItems();
      const checked = { 1: items[0], 2: items[1], 3: items[2] };

      const progress = checklistService.calculateProgress(checked);

      expect(progress.completed).toBe(3);
      expect(progress.total).toBe(28);
      expect(progress.percentage).toBe(10);
    });

    it('should return 100% when all items checked', () => {
      const items = checklistService.getChecklistItems();
      const checked: any = {};
      items.forEach((item, index) => {
        checked[item.id] = item;
      });

      const progress = checklistService.calculateProgress(checked);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('validateChecklist', () => {
    it('should be valid when all required items passed', () => {
      const items = checklistService.getChecklistItems();
      const requiredItems = checklistService.getRequiredItems();
      const checked: any = {};

      requiredItems.forEach((item) => {
        checked[item.id] = { ...item, status: 'pass' };
      });

      const validation = checklistService.validateChecklist(checked);
      expect(validation.isValid).toBe(true);
      expect(validation.failedItems).toHaveLength(0);
      expect(validation.missingRequired).toHaveLength(0);
    });

    it('should be invalid with failed items', () => {
      const items = checklistService.getChecklistItems();
      const checked: any = { 1: { ...items[0], status: 'fail' } };

      const validation = checklistService.validateChecklist(checked);
      expect(validation.isValid).toBe(false);
      expect(validation.failedItems.length).toBeGreaterThan(0);
    });

    it('should be invalid with missing required items', () => {
      const checked: any = { 1: { id: 1, status: 'pass' } };

      const validation = checklistService.validateChecklist(checked);
      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired.length).toBeGreaterThan(0);
    });
  });
});

describe('Expense Service', () => {
  describe('getCategories', () => {
    it('should return 5 expense categories', () => {
      const categories = expenseService.getCategories();
      expect(categories).toHaveLength(5);
    });

    it('should have correct GL account codes', () => {
      const categories = expenseService.getCategories();
      const glAccounts = categories.map((c) => c.glAccount);
      expect(glAccounts).toContain('6001'); // Fuel
      expect(glAccounts).toContain('6003'); // Toll
      expect(glAccounts).toContain('6002'); // Driver advance
    });
  });

  describe('getCategoryByType', () => {
    it('should find category by type', () => {
      const fuel = expenseService.getCategoryByType('fuel');
      expect(fuel?.label_en).toBe('Fuel');
      expect(fuel?.glAccount).toBe('6001');
    });

    it('should return undefined for invalid type', () => {
      const invalid = expenseService.getCategoryByType('invalid' as any);
      expect(invalid).toBeUndefined();
    });
  });

  describe('calculateTotal', () => {
    it('should sum all expense amounts', () => {
      const expenses = [
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 10000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'toll' as const, amount_paisa: 5000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 3000, description: '', date: '2026-08-17' },
      ];

      const total = expenseService.calculateTotal(expenses);
      expect(total).toBe(18000);
    });

    it('should return 0 for empty expenses', () => {
      const total = expenseService.calculateTotal([]);
      expect(total).toBe(0);
    });
  });

  describe('calculateByType', () => {
    it('should group totals by expense type', () => {
      const expenses = [
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 10000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'toll' as const, amount_paisa: 5000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 3000, description: '', date: '2026-08-17' },
      ];

      const byType = expenseService.calculateByType(expenses);
      expect(byType.fuel).toBe(13000);
      expect(byType.toll).toBe(5000);
      expect(byType.driver_advance).toBe(0);
    });
  });

  describe('formatAmount', () => {
    it('should format paisa to PKR', () => {
      expect(expenseService.formatAmount(10000)).toBe('₨ 100.00');
      expect(expenseService.formatAmount(5050)).toBe('₨ 50.50');
    });
  });

  describe('validateExpense', () => {
    it('should validate complete expense', () => {
      const expense = {
        trip_id: 1,
        type: 'fuel' as const,
        amount_paisa: 10000,
        description: 'Petrol at Islamabad',
        date: '2026-08-17',
      };

      const validation = expenseService.validateExpense(expense);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch missing fields', () => {
      const expense = {
        trip_id: 1,
        amount_paisa: 10000,
      };

      const validation = expenseService.validateExpense(expense);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject zero amount', () => {
      const expense = {
        trip_id: 1,
        type: 'fuel' as const,
        amount_paisa: 0,
        description: 'Test',
        date: '2026-08-17',
      };

      const validation = expenseService.validateExpense(expense);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Amount must be greater than 0');
    });
  });

  describe('groupByType', () => {
    it('should group expenses by type', () => {
      const expenses = [
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 10000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'toll' as const, amount_paisa: 5000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 3000, description: '', date: '2026-08-17' },
      ];

      const grouped = expenseService.groupByType(expenses);
      expect(grouped.fuel).toHaveLength(2);
      expect(grouped.toll).toHaveLength(1);
    });
  });

  describe('groupByDate', () => {
    it('should group expenses by date', () => {
      const expenses = [
        { trip_id: 1, type: 'fuel' as const, amount_paisa: 10000, description: '', date: '2026-08-17' },
        { trip_id: 1, type: 'toll' as const, amount_paisa: 5000, description: '', date: '2026-08-18' },
      ];

      const grouped = expenseService.groupByDate(expenses);
      expect(Object.keys(grouped)).toHaveLength(2);
    });
  });
});

describe('Location Service', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Islamabad to Rawalpindi (approximate 15 km)
      const distance = locationService.calculateDistance(33.7294, 73.1882, 33.5731, 73.1898);
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(20);
    });

    it('should return 0 for same coordinates', () => {
      const distance = locationService.calculateDistance(33.7294, 73.1882, 33.7294, 73.1882);
      expect(distance).toBeLessThan(0.1);
    });
  });

  describe('getOnlineStatus', () => {
    it('should return online status', () => {
      const status = locationService.getOnlineStatus();
      expect(typeof status).toBe('boolean');
    });
  });
});
