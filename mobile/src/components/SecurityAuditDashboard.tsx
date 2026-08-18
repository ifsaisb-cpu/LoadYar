import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { securityService } from '../services/securityService';
import type { ComplianceStatus, AuditLog, SecurityIncident } from '../services/securityService';

interface SecurityAuditDashboardProps {
  onClose: () => void;
}

export const SecurityAuditDashboard: React.FC<SecurityAuditDashboardProps> = ({ onClose }) => {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateData = () => {
    setComplianceStatus(securityService.getComplianceStatus());
    setAuditLogs(securityService.getAuditLogs(50));
    setIncidents(securityService.getIncidents(20));
  };

  const handleResolveIncident = (incidentId: string) => {
    securityService.resolveIncident(incidentId, 'Resolved by admin');
    updateData();
    Alert.alert('Success', 'Incident marked as resolved');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#84cc16';
      default:
        return '#999';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔐 Security Audit</Text>
        <TouchableOpacity onPress={updateData}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Compliance Score */}
        {complianceStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compliance Status</Text>

            {/* Overall Score */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{Math.round(complianceStatus.overall)}%</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>Overall Compliance</Text>
                <Text style={styles.scoreDesc}>
                  {complianceStatus.overall >= 90
                    ? '✓ Excellent'
                    : complianceStatus.overall >= 80
                      ? '⚠️ Good'
                      : '❌ Needs Work'}
                </Text>
              </View>
            </View>

            {/* Compliance Metrics Grid */}
            <View style={styles.metricsGrid}>
              {[
                { key: 'dataEncryption', label: '🔒 Encryption', value: complianceStatus.dataEncryption },
                { key: 'accessControl', label: '👤 Access Control', value: complianceStatus.accessControl },
                { key: 'auditLogging', label: '📝 Audit Logging', value: complianceStatus.auditLogging },
                { key: 'sessionManagement', label: '⏱️ Session Mgmt', value: complianceStatus.sessionManagement },
                { key: 'passwordPolicy', label: '🔑 Password Policy', value: complianceStatus.passwordPolicy },
                { key: 'biometricAuth', label: '🔐 Biometric', value: complianceStatus.biometricAuth },
              ].map((metric) => (
                <View key={metric.key} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <View style={styles.metricBarBg}>
                    <View
                      style={[
                        styles.metricBar,
                        { width: `${metric.value}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.metricValue}>{metric.value}%</Text>
                </View>
              ))}
            </View>

            {/* Standards Compliance */}
            <View style={styles.standardsCard}>
              <Text style={styles.standardsTitle}>📋 Standards Compliance</Text>

              <View style={styles.standardRow}>
                <Text style={styles.standardLabel}>GDPR Compliance</Text>
                <Text
                  style={[
                    styles.standardStatus,
                    { color: complianceStatus.gdprCompliance >= 95 ? '#10b981' : '#f59e0b' },
                  ]}
                >
                  {complianceStatus.gdprCompliance >= 95 ? '✓ Compliant' : '⚠️ Review'}
                </Text>
              </View>

              <View style={styles.standardRow}>
                <Text style={styles.standardLabel}>CCPA Compliance</Text>
                <Text
                  style={[
                    styles.standardStatus,
                    { color: complianceStatus.ccpaCompliance >= 95 ? '#10b981' : '#f59e0b' },
                  ]}
                >
                  {complianceStatus.ccpaCompliance >= 95 ? '✓ Compliant' : '⚠️ Review'}
                </Text>
              </View>

              <View style={styles.standardRow}>
                <Text style={styles.standardLabel}>Data Retention</Text>
                <Text
                  style={[
                    styles.standardStatus,
                    { color: complianceStatus.dataRetention >= 90 ? '#10b981' : '#f59e0b' },
                  ]}
                >
                  {complianceStatus.dataRetention >= 90 ? '✓ Compliant' : '⚠️ Review'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Incidents */}
        {incidents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🚨 Security Incidents ({incidents.length})</Text>
              <Text style={styles.unresolvedCount}>
                {incidents.filter((i) => !i.resolved).length} Unresolved
              </Text>
            </View>

            {incidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                style={[
                  styles.incidentCard,
                  { borderLeftColor: getSeverityColor(incident.severity) },
                ]}
                onPress={() => {
                  setSelectedIncident(incident);
                  setShowIncidentDetails(true);
                }}
              >
                <View style={styles.incidentHeader}>
                  <Text style={styles.incidentIcon}>
                    {getSeverityIcon(incident.severity)}
                  </Text>
                  <View style={styles.incidentInfo}>
                    <Text style={styles.incidentType}>{incident.type.replace(/_/g, ' ')}</Text>
                    <Text style={styles.incidentTime}>
                      {new Date(incident.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.incidentSeverity,
                      { color: getSeverityColor(incident.severity) },
                    ]}
                  >
                    {incident.severity.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.incidentDesc} numberOfLines={2}>
                  {incident.description}
                </Text>

                {!incident.resolved && (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => handleResolveIncident(incident.id)}
                  >
                    <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}

                {incident.resolved && (
                  <Text style={styles.resolvedBadge}>✓ Resolved</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Audit Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Audit Logs (Last 20)</Text>

          {auditLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.logContent}>
                <Text style={styles.logAction}>{log.action}</Text>
                <Text style={styles.logDetails}>
                  {log.userId} → {log.resource}
                </Text>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>

              <Text
                style={[
                  styles.logStatus,
                  {
                    color:
                      log.status === 'success'
                        ? '#10b981'
                        : log.status === 'failure'
                          ? '#ef4444'
                          : '#f59e0b',
                  },
                ]}
              >
                {log.status === 'success' && '✓'}
                {log.status === 'failure' && '✕'}
                {log.status === 'blocked' && '🚫'}
              </Text>
            </View>
          ))}
        </View>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🛡️ Security Best Practices</Text>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Use strong passwords: 8+ chars, uppercase, numbers, symbols</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Enable biometric authentication for quick & secure access</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Log out when finished, especially on shared devices</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Never share your session token or authentication credentials</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Review audit logs regularly for suspicious activity</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Update app regularly for latest security patches</Text>
          </View>
        </View>
      </ScrollView>

      {/* Incident Details Modal */}
      <Modal visible={showIncidentDetails && selectedIncident !== null} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowIncidentDetails(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Incident Details</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedIncident && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedIncident.type.replace(/_/g, ' ')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Severity:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getSeverityColor(selectedIncident.severity) },
                      ]}
                    >
                      {selectedIncident.severity.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedIncident.timestamp).toLocaleString()}
                    </Text>
                  </View>

                  {selectedIncident.userId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>User ID:</Text>
                      <Text style={styles.detailValue}>{selectedIncident.userId}</Text>
                    </View>
                  )}

                  {selectedIncident.resource && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Resource:</Text>
                      <Text style={styles.detailValue}>{selectedIncident.resource}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: selectedIncident.resolved ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {selectedIncident.resolved ? 'Resolved' : 'Unresolved'}
                    </Text>
                  </View>

                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedIncident.description}</Text>
                  </View>

                  {!selectedIncident.resolved && (
                    <TouchableOpacity
                      style={styles.resolveModal}
                      onPress={() => {
                        handleResolveIncident(selectedIncident.id);
                        setShowIncidentDetails(false);
                      }}
                    >
                      <Text style={styles.resolveModalText}>✓ Mark as Resolved</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
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
  refreshIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  unresolvedCount: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scoreDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricsGrid: {
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  metricBarBg: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  metricBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  standardsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  standardsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  standardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  standardLabel: {
    fontSize: 12,
    color: '#166534',
  },
  standardStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  incidentCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  incidentTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  incidentSeverity: {
    fontSize: 11,
    fontWeight: '600',
  },
  incidentDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  resolveButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  resolveButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  resolvedBadge: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logContent: {
    flex: 1,
  },
  logAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  logDetails: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  logTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  logStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 14,
    color: '#10b981',
    marginRight: 10,
  },
  tipText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  resolveModal: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  resolveModalText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});

export default SecurityAuditDashboard;
