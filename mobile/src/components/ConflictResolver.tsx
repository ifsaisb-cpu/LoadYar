import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useCRDTStore } from '../store/crdtStore';
import type { ConflictRecord } from '../store/crdtStore';

interface ConflictResolverProps {
  onClose: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({ onClose }) => {
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergedData, setMergedData] = useState<Record<string, any>>({});

  const { getUnresolvedConflicts, resolveConflict, autoResolveConflicts, conflicts } = useCRDTStore();
  const unresolvedConflicts = useMemo(() => getUnresolvedConflicts(), [getUnresolvedConflicts]);

  const handleAutoResolve = () => {
    const resolved = autoResolveConflicts();
    Alert.alert('Auto-Resolved', `${resolved.length} conflict(s) resolved automatically`);
  };

  const handleResolve = (conflictId: string, resolution: 'local' | 'remote') => {
    resolveConflict(conflictId, resolution);
    setSelectedConflict(null);
    Alert.alert('Resolved', 'Conflict resolved successfully');
  };

  const handleMergeSubmit = () => {
    if (!selectedConflict) return;

    resolveConflict(selectedConflict.id, 'merged', mergedData);
    setShowMergeModal(false);
    setSelectedConflict(null);
    Alert.alert('Merged', 'Records merged successfully');
  };

  if (!selectedConflict) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚠️ Sync Conflicts</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {unresolvedConflicts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyText}>No conflicts</Text>
              <Text style={styles.emptySubtext}>
                All data is synchronized. Latest sync: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ {unresolvedConflicts.length} Conflict(s) Detected</Text>
                <Text style={styles.infoText}>
                  Data was modified offline and on server. Choose which version to keep or merge both.
                </Text>

                <TouchableOpacity style={styles.autoResolveButton} onPress={handleAutoResolve}>
                  <Text style={styles.autoResolveButtonText}>🔄 Auto-Resolve All</Text>
                </TouchableOpacity>
              </View>

              {unresolvedConflicts.map((conflict) => (
                <TouchableOpacity
                  key={conflict.id}
                  style={styles.conflictCard}
                  onPress={() => setSelectedConflict(conflict)}
                >
                  <View style={styles.conflictHeader}>
                    <Text style={styles.conflictType}>
                      {conflict.recordType.toUpperCase()}
                    </Text>
                    <Text style={styles.conflictBadge}>
                      {conflict.conflictType === 'concurrent_update' && '🔄'}
                      {conflict.conflictType === 'update_vs_delete' && '⚠️'}
                      {conflict.conflictType === 'concurrent_delete' && '🗑️'}
                    </Text>
                  </View>

                  <View style={styles.conflictDetails}>
                    <View style={styles.versionRow}>
                      <Text style={styles.versionLabel}>📱 Local:</Text>
                      <Text style={styles.versionTime}>
                        {new Date(conflict.localVersion.timestamp).toLocaleTimeString()}
                      </Text>
                      <Text
                        style={[
                          styles.versionOp,
                          conflict.localVersion.operation === 'delete' && styles.deleteOp,
                        ]}
                      >
                        {conflict.localVersion.operation === 'delete' ? 'DELETED' : 'UPDATED'}
                      </Text>
                    </View>

                    <View style={styles.versionRow}>
                      <Text style={styles.versionLabel}>☁️ Remote:</Text>
                      <Text style={styles.versionTime}>
                        {new Date(conflict.remoteVersion.timestamp).toLocaleTimeString()}
                      </Text>
                      <Text
                        style={[
                          styles.versionOp,
                          conflict.remoteVersion.operation === 'delete' && styles.deleteOp,
                        ]}
                      >
                        {conflict.remoteVersion.operation === 'delete' ? 'DELETED' : 'UPDATED'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.tapToResolve}>Tap to resolve →</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedConflict(null)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Resolve Conflict</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Conflict Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Record Type:</Text>
            <Text style={styles.detailValue}>{selectedConflict.recordType.toUpperCase()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Conflict Type:</Text>
            <Text style={styles.detailValue}>
              {selectedConflict.conflictType.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Record ID:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {selectedConflict.recordId}
            </Text>
          </View>
        </View>

        {/* Local Version */}
        <View style={styles.versionCard}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionTitle}>📱 Local Version (Your Phone)</Text>
            <Text style={styles.versionDate}>
              {new Date(selectedConflict.localVersion.timestamp).toLocaleString()}
            </Text>
          </View>

          <View style={styles.dataDisplay}>
            {Object.entries(selectedConflict.localVersion.data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={styles.dataKey}>{key}:</Text>
                <Text style={styles.dataValue} numberOfLines={2}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleResolve(selectedConflict.id, 'local')}
          >
            <Text style={styles.selectButtonText}>✓ Keep This Version</Text>
          </TouchableOpacity>
        </View>

        {/* Remote Version */}
        <View style={styles.versionCard}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionTitle}>☁️ Server Version (Remote)</Text>
            <Text style={styles.versionDate}>
              {new Date(selectedConflict.remoteVersion.timestamp).toLocaleString()}
            </Text>
          </View>

          <View style={styles.dataDisplay}>
            {Object.entries(selectedConflict.remoteVersion.data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={styles.dataKey}>{key}:</Text>
                <Text style={styles.dataValue} numberOfLines={2}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleResolve(selectedConflict.id, 'remote')}
          >
            <Text style={styles.selectButtonText}>✓ Keep This Version</Text>
          </TouchableOpacity>
        </View>

        {/* Merge Option */}
        <View style={styles.mergeCard}>
          <Text style={styles.mergeTitle}>🔄 Merge Both Versions</Text>
          <Text style={styles.mergeDescription}>
            Combine the best parts of both versions. Modified fields will use the most recent value.
          </Text>

          <TouchableOpacity
            style={styles.mergeButton}
            onPress={() => {
              setMergedData({
                ...selectedConflict.localVersion.data,
                ...selectedConflict.remoteVersion.data,
              });
              setShowMergeModal(true);
            }}
          >
            <Text style={styles.mergeButtonText}>+ Create Merged Version</Text>
          </TouchableOpacity>
        </View>

        {/* Conflict Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How to Resolve</Text>
          <Text style={styles.infoText}>
            • <Text style={{ fontWeight: '600' }}>Keep Local:</Text> Use your phone's version (last modified {new Date(selectedConflict.localVersion.timestamp).toLocaleTimeString()})
          </Text>
          <Text style={styles.infoText}>
            • <Text style={{ fontWeight: '600' }}>Keep Remote:</Text> Use the server version (last modified {new Date(selectedConflict.remoteVersion.timestamp).toLocaleTimeString()})
          </Text>
          <Text style={styles.infoText}>
            • <Text style={{ fontWeight: '600' }}>Merge:</Text> Combine fields from both versions intelligently
          </Text>
        </View>
      </ScrollView>

      {/* Merge Modal */}
      <Modal visible={showMergeModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMergeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Merged Version</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalFieldsTitle}>Review merged fields:</Text>

              {Object.entries(mergedData).map(([key, value]) => (
                <View key={key} style={styles.mergeField}>
                  <Text style={styles.fieldKey}>{key}</Text>
                  <Text style={styles.fieldValue}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Text>

                  <View style={styles.fieldOptions}>
                    <TouchableOpacity
                      style={styles.fieldOption}
                      onPress={() => {
                        setMergedData({
                          ...mergedData,
                          [key]: selectedConflict.localVersion.data[key],
                        });
                      }}
                    >
                      <Text style={styles.fieldOptionText}>Use Local</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.fieldOption}
                      onPress={() => {
                        setMergedData({
                          ...mergedData,
                          [key]: selectedConflict.remoteVersion.data[key],
                        });
                      }}
                    >
                      <Text style={styles.fieldOptionText}>Use Remote</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowMergeModal(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleMergeSubmit}>
                <Text style={styles.modalConfirmButtonText}>✓ Confirm Merge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1a1a1a',
    lineHeight: 18,
    marginBottom: 8,
  },
  autoResolveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  autoResolveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  conflictCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conflictType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  conflictBadge: {
    fontSize: 20,
  },
  conflictDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    minWidth: 50,
  },
  versionTime: {
    fontSize: 11,
    color: '#999',
    flex: 1,
  },
  versionOp: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteOp: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  tapToResolve: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
    textAlign: 'right',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  versionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  versionHeader: {
    marginBottom: 12,
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  versionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  dataDisplay: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dataRow: {
    marginBottom: 10,
  },
  dataKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  selectButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  mergeCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  mergeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 6,
  },
  mergeDescription: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 12,
  },
  mergeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mergeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
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
    flex: 0.8,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalFieldsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  mergeField: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  fieldKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 10,
  },
  fieldOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldOption: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  fieldOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});

export default ConflictResolver;
