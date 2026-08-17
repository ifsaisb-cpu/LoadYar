import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { checklistService, ChecklistItem } from '../../services/checklist';
import { apiClient } from '../../services/api';

interface ChecklistState {
  [key: number]: ChecklistItem;
}

export default function ChecklistScreen({ route }: any) {
  const { tripId } = route.params;
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<ChecklistState>({});
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{
    itemId: number;
    text: string;
  } | null>(null);

  useEffect(() => {
    const items = checklistService.getChecklistItems();
    setChecklist(items);
    loadChecklistState();
  }, [tripId]);

  const loadChecklistState = async () => {
    try {
      const response = await apiClient.get(`/trips/${tripId}/checklist`);
      if (response.data) {
        const stateMap: ChecklistState = {};
        const notesMap: { [key: number]: string } = {};

        response.data.forEach((item: any) => {
          stateMap[item.item_id] = item;
          if (item.notes) {
            notesMap[item.item_id] = item.notes;
          }
        });

        setChecked(stateMap);
        setNotes(notesMap);
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  };

  const toggleItem = (item: ChecklistItem) => {
    setChecked((prev) => {
      if (prev[item.id]) {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      } else {
        return {
          ...prev,
          [item.id]: item,
        };
      }
    });
  };

  const setItemStatus = (itemId: number, status: 'pass' | 'fail' | 'n/a') => {
    setChecked((prev) => {
      const item = checklist.find((i) => i.id === itemId);
      if (!item) return prev;

      return {
        ...prev,
        [itemId]: { ...item, status },
      };
    });
  };

  const submitChecklist = async () => {
    const validation = checklistService.validateChecklist(checked);

    if (!validation.isValid) {
      let message = 'Checklist incomplete.\n\n';

      if (validation.missingRequired.length > 0) {
        message += `Missing required items:\n${validation.missingRequired
          .map((i) => `• ${i.name_en}`)
          .join('\n')}\n\n`;
      }

      if (validation.failedItems.length > 0) {
        message += `Failed items:\n${validation.failedItems
          .map((i) => `• ${i.name_en}`)
          .join('\n')}`;
      }

      Alert.alert('Validation Error', message);
      return;
    }

    setLoading(true);
    try {
      const payload = Object.values(checked).map((item) => ({
        trip_id: tripId,
        item_id: item.id,
        status: item.status || 'pass',
        notes: notes[item.id] || '',
      }));

      await apiClient.post(`/trips/${tripId}/checklist`, {
        items: payload,
        completed_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Checklist submitted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit checklist');
    } finally {
      setLoading(false);
    }
  };

  const progress = checklistService.calculateProgress(checked);

  const categories = [
    'exterior',
    'interior',
    'mechanical',
    'safety',
    'documentation',
  ];

  const sections = categories.map((cat) => ({
    title: cat.charAt(0).toUpperCase() + cat.slice(1),
    data: checklistService.getItemsByCategory(cat as any),
  }));

  const renderChecklistItem = ({ item }: { item: ChecklistItem }) => {
    const isChecked = !!checked[item.id];
    const status = checked[item.id]?.status;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => toggleItem(item)}
        >
          <View
            style={[
              styles.checkbox,
              isChecked && styles.checkboxChecked,
              status === 'fail' && styles.checkboxFail,
            ]}
          >
            {isChecked && status === 'pass' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
            {status === 'fail' && <Text style={styles.failMark}>✗</Text>}
          </View>

          <View style={styles.itemText}>
            <Text style={styles.itemName}>{item.name_en}</Text>
            <Text style={styles.itemNameUr}>{item.name_ur}</Text>
          </View>

          {item.required && (
            <Text style={styles.requiredBadge}>Required</Text>
          )}
        </TouchableOpacity>

        {isChecked && (
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                status === 'pass' && styles.statusBtnActive,
              ]}
              onPress={() => setItemStatus(item.id, 'pass')}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  status === 'pass' && styles.statusBtnTextActive,
                ]}
              >
                Pass
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                status === 'fail' && styles.statusBtnActive,
              ]}
              onPress={() => setItemStatus(item.id, 'fail')}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  status === 'fail' && styles.statusBtnTextActive,
                ]}
              >
                Fail
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                status === 'n/a' && styles.statusBtnActive,
              ]}
              onPress={() => setItemStatus(item.id, 'n/a')}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  status === 'n/a' && styles.statusBtnTextActive,
                ]}
              >
                N/A
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notesBtn}
              onPress={() =>
                setSelectedNote({ itemId: item.id, text: notes[item.id] || '' })
              }
            >
              <Text style={styles.notesBtnText}>📝</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Checklist</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.completed} of {progress.total} ({progress.percentage}%)
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChecklistItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        scrollEnabled={true}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={submitChecklist}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting...' : 'Submit Checklist'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!selectedNote} transparent animationType="slide">
        <SafeAreaView style={styles.noteModal}>
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Add Notes</Text>
            <ScrollView style={styles.noteInput}>
              <Text>{selectedNote?.text}</Text>
            </ScrollView>
            <View style={styles.noteButtons}>
              <TouchableOpacity
                style={styles.noteCloseBtn}
                onPress={() => setSelectedNote(null)}
              >
                <Text style={styles.noteCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
  itemContainer: {
    marginVertical: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxFail: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  failMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemNameUr: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  requiredBadge: {
    fontSize: 10,
    color: '#d32f2f',
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ffebee',
    borderRadius: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    marginTop: 4,
    borderRadius: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusBtnActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  notesBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  notesBtnText: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  noteContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  noteButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  noteCloseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noteCloseBtnText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
});
