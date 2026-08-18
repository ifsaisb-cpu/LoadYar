import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import type { ChecklistItem } from '../store/deliveryStore';

interface DeliveryChecklistProps {
  items: ChecklistItem[];
  onItemToggle: (itemId: number, checked: boolean) => void;
  onItemNotes: (itemId: number, notes: string) => void;
}

export const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({
  items,
  onItemToggle,
  onItemNotes,
}) => {
  const completedCount = items.filter((item) => item.checked).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>✓ Delivery Checklist</Text>
        <Text style={styles.progress}>
          {completedCount} of {items.length} completed
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#10b981' : '#2563eb',
            },
          ]}
        />
      </View>

      {/* Checklist Items */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <View key={item.id} style={styles.checklistItem}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onItemToggle(item.id, !item.checked)}
            >
              <View
                style={[
                  styles.checkboxBox,
                  item.checked && styles.checkboxChecked,
                ]}
              >
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemLabel,
                  item.checked && styles.itemLabelCompleted,
                ]}
              >
                {item.label}
              </Text>

              {item.checked && (
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes (optional)..."
                  placeholderTextColor="#999"
                  value={item.notes || ''}
                  onChangeText={(text) => onItemNotes(item.id, text)}
                  multiline
                  numberOfLines={2}
                />
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Completion Message */}
      {progress === 100 && (
        <View style={styles.completionMessage}>
          <Text style={styles.completionText}>
            🎉 All items checked! Ready to proceed.
          </Text>
        </View>
      )}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  progress: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  checkbox: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  itemLabelCompleted: {
    color: '#10b981',
    textDecorationLine: 'line-through',
  },
  notesInput: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1a1a1a',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  completionMessage: {
    backgroundColor: '#dcfce7',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
});

export default DeliveryChecklist;
