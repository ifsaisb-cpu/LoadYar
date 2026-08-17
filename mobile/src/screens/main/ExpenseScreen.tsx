import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useExpensesStore } from '../../store/expenses';
import { expenseService, ExpenseType } from '../../services/expense';
import { Expense } from '../../services/expense';

export default function ExpenseScreen({ route }: any) {
  const { tripId } = route.params;
  const {
    tripExpenses,
    fetchTripExpenses,
    createExpense,
    deleteExpense,
    isLoading,
  } = useExpensesStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    trip_id: tripId,
    type: 'fuel',
    amount_paisa: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTripExpenses(tripId);
  }, [tripId]);

  const expenses = tripExpenses[tripId] || [];
  const total = expenseService.calculateTotal(expenses);
  const byType = expenseService.calculateByType(expenses);

  const handleAddExpense = async () => {
    try {
      await createExpense(formData);
      setShowAddModal(false);
      setFormData({
        trip_id: tripId,
        type: 'fuel',
        amount_paisa: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Success', 'Expense added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = (expenseId: string | undefined) => {
    if (!expenseId) return;

    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteExpense(expenseId);
            Alert.alert('Success', 'Expense deleted');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const category = expenseService.getCategoryByType(item.type);

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseType}>
            <Text style={styles.icon}>{category?.icon}</Text>
            <View>
              <Text style={styles.typeLabel}>{category?.label_en}</Text>
              <Text style={styles.typeUrdu}>{category?.label_ur}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteExpense(item.id)}>
            <Text style={styles.deleteBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.expenseFooter}>
          <Text style={styles.amount}>
            {expenseService.formatAmount(item.amount_paisa)}
          </Text>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Cards */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={styles.totalAmount}>
              {expenseService.formatAmount(total)}
            </Text>
          </View>

          <View style={styles.categoriesGrid}>
            {Object.entries(byType).map(([type, amount]) => {
              if (amount === 0) return null;
              const category = expenseService.getCategoryByType(type as ExpenseType);
              return (
                <View
                  key={type}
                  style={[
                    styles.categoryCard,
                    { borderColor: category?.color || '#999' },
                  ]}
                >
                  <Text style={styles.categoryIcon}>{category?.icon}</Text>
                  <Text style={styles.categoryName}>{category?.label_en}</Text>
                  <Text style={styles.categoryAmount}>
                    {expenseService.formatAmount(amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Expense List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Expenses</Text>

          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add expenses
              </Text>
            </View>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id?.toString() || ''}
              renderItem={renderExpenseItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {/* Type Selector */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeGrid}>
                {expenseService.getCategories().map((category) => (
                  <TouchableOpacity
                    key={category.type}
                    style={[
                      styles.typeOption,
                      formData.type === category.type &&
                        styles.typeOptionSelected,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, type: category.type })
                    }
                  >
                    <Text style={styles.typeOptionIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.typeOptionLabel,
                        formData.type === category.type &&
                          styles.typeOptionLabelSelected,
                      ]}
                    >
                      {category.label_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <Text style={styles.label}>Amount (PKR)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={
                  formData.amount_paisa ? (formData.amount_paisa / 100).toString() : ''
                }
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    amount_paisa: Math.round(parseFloat(text || '0') * 100),
                  })
                }
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter expense details"
                multiline
                numberOfLines={3}
                value={formData.description || ''}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
              />

              {/* Date */}
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.date || ''}
                onChangeText={(text) =>
                  setFormData({ ...formData, date: text })
                }
              />

              {/* Reference */}
              <Text style={styles.label}>Receipt Reference</Text>
              <TextInput
                style={styles.input}
                placeholder="WhatsApp message link or file reference"
                value={formData.receipt_reference || ''}
                onChangeText={(text) =>
                  setFormData({ ...formData, receipt_reference: text })
                }
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddExpense}
              disabled={isLoading}
            >
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Adding...' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  totalCard: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
  },
  listSection: {
    paddingHorizontal: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  typeUrdu: {
    fontSize: 11,
    color: '#666',
  },
  deleteBtn: {
    fontSize: 18,
    color: '#d32f2f',
    padding: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0066cc',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeBtn: {
    fontSize: 24,
    color: '#999',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  typeOptionSelected: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
  },
  typeOptionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  typeOptionLabelSelected: {
    color: '#0066cc',
  },
  submitBtn: {
    backgroundColor: '#0066cc',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
