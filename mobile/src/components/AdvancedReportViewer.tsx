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
import { useReportingStore } from '../store/reportingStore';
import type { DailyReport, WeeklyReport, MonthlyReport } from '../store/reportingStore';

interface AdvancedReportViewerProps {
  onClose: () => void;
}

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export const AdvancedReportViewer: React.FC<AdvancedReportViewerProps> = ({ onClose }) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('daily');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    dailyReports,
    weeklyReports,
    monthlyReports,
    customReports,
    exports,
    exportReport,
  } = useReportingStore();

  const reportsList = useMemo(() => {
    switch (selectedReportType) {
      case 'daily':
        return dailyReports.slice().reverse();
      case 'weekly':
        return weeklyReports.slice().reverse();
      case 'monthly':
        return monthlyReports.slice().reverse();
      case 'custom':
        return customReports.slice().reverse();
      default:
        return [];
    }
  }, [selectedReportType, dailyReports, weeklyReports, monthlyReports, customReports]);

  const handleExport = async () => {
    if (!selectedReport) {
      Alert.alert('Error', 'No report selected');
      return;
    }

    try {
      const export_ = await exportReport(selectedReport.id || '', exportFormat);
      Alert.alert(
        'Export Successful',
        `File: ${export_.file_name}\nSize: ${(export_.file_size / 1024).toFixed(2)} KB\nReady to download`
      );
      setShowExportModal(false);
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const renderDailyReport = (report: DailyReport) => (
    <View key={report.date} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
        <Text style={styles.reportStatus}>
          {report.completed_trips}/{report.total_trips} ✓
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Earnings</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            {formatCurrency(report.total_earnings)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Expenses</Text>
          <Text style={[styles.metricValue, { color: '#ef4444' }]}>
            {formatCurrency(report.total_expenses)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Net</Text>
          <Text style={[styles.metricValue, { color: '#2563eb', fontWeight: 'bold' }]}>
            {formatCurrency(report.net_earnings)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Rating</Text>
          <Text style={styles.metricValue}>⭐ {report.average_rating.toFixed(1)}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Distance</Text>
          <Text style={styles.metricValue}>{report.total_distance.toFixed(1)} km</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>On-Time</Text>
          <Text style={styles.metricValue}>{report.on_time_percentage.toFixed(0)}%</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setSelectedReport(report)}
      >
        <Text style={styles.selectButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeeklyReport = (report: WeeklyReport) => (
    <View key={report.week_start} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportDate}>
          {formatDate(report.week_start)} - {formatDate(report.week_end)}
        </Text>
        <Text style={styles.reportStatus}>Week Summary</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Trips</Text>
          <Text style={styles.metricValue}>{report.completed_trips}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Revenue</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            {formatCurrency(report.total_earnings)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Distance</Text>
          <Text style={styles.metricValue}>{report.total_distance.toFixed(0)} km</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Avg Rating</Text>
          <Text style={styles.metricValue}>{report.average_rating.toFixed(1)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setSelectedReport(report)}
      >
        <Text style={styles.selectButtonText}>View Week Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMonthlyReport = (report: MonthlyReport) => (
    <View key={`${report.month}-${report.year}`} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportDate}>
          {new Date(report.year, report.month - 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.reportStatus}>Monthly Summary</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Trips</Text>
          <Text style={styles.metricValue}>{report.completed_trips}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Revenue</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            {formatCurrency(report.total_earnings)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Net Earnings</Text>
          <Text style={[styles.metricValue, { color: '#2563eb', fontWeight: 'bold' }]}>
            {formatCurrency(report.net_earnings)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Best Day</Text>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            {formatCurrency(report.top_earning_day.total_earnings)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setSelectedReport(report)}
      >
        <Text style={styles.selectButtonText}>View Month Details</Text>
      </TouchableOpacity>
    </View>
  );

  if (selectedReport) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedReport(null)}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Report Details</Text>
          <TouchableOpacity onPress={() => setShowExportModal(true)}>
            <Text style={styles.exportIcon}>⬇️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Summary</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Trips:</Text>
              <Text style={styles.detailValue}>
                {selectedReport.completed_trips || selectedReport.total_trips}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Revenue:</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>
                {formatCurrency(selectedReport.total_earnings)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expenses:</Text>
              <Text style={[styles.detailValue, { color: '#ef4444' }]}>
                {formatCurrency(selectedReport.total_expenses)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Net Earnings:</Text>
              <Text style={[styles.detailValue, { color: '#2563eb', fontWeight: 'bold' }]}>
                {formatCurrency(selectedReport.net_earnings)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>{selectedReport.total_distance.toFixed(1)} km</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Avg Rating:</Text>
              <Text style={styles.detailValue}>⭐ {selectedReport.average_rating.toFixed(1)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>On-Time %:</Text>
              <Text style={styles.detailValue}>{selectedReport.on_time_percentage.toFixed(0)}%</Text>
            </View>
          </View>

          {selectedReport.revenue_per_km && (
            <View style={styles.performanceCard}>
              <Text style={styles.detailTitle}>Performance Metrics</Text>

              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>Revenue per km</Text>
                <Text style={styles.perfValue}>
                  PKR {selectedReport.revenue_per_km.toFixed(2)}
                </Text>
              </View>

              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>Avg Trip Value</Text>
                <Text style={styles.perfValue}>
                  {formatCurrency(selectedReport.avg_trip_value || 0)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.exportCard}>
            <Text style={styles.cardTitle}>📥 Export Report</Text>
            <Text style={styles.cardDesc}>Download this report in various formats</Text>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                setExportFormat('pdf');
                handleExport();
              }}
            >
              <Text style={styles.exportButtonIcon}>📄</Text>
              <Text style={styles.exportButtonText}>Export as PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                setExportFormat('csv');
                handleExport();
              }}
            >
              <Text style={styles.exportButtonIcon}>📊</Text>
              <Text style={styles.exportButtonText}>Export as CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                setExportFormat('json');
                handleExport();
              }}
            >
              <Text style={styles.exportButtonIcon}>{ }</Text>
              <Text style={styles.exportButtonText}>Export as JSON</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Advanced Reports</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabBar}>
        {(['daily', 'weekly', 'monthly', 'custom'] as ReportType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.tab,
              selectedReportType === type && styles.tabActive,
            ]}
            onPress={() => setSelectedReportType(type)}
          >
            <Text
              style={[
                styles.tabText,
                selectedReportType === type && styles.tabTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {reportsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No {selectedReportType} reports</Text>
            <Text style={styles.emptySubtext}>Reports will appear here once generated</Text>
          </View>
        ) : (
          reportsList.map((report) => {
            switch (selectedReportType) {
              case 'daily':
                return renderDailyReport(report as DailyReport);
              case 'weekly':
                return renderWeeklyReport(report as WeeklyReport);
              case 'monthly':
                return renderMonthlyReport(report as MonthlyReport);
              default:
                return (
                  <View key={report.id} style={styles.reportCard}>
                    <Text style={styles.reportDate}>{report.name}</Text>
                  </View>
                );
            }
          })
        )}
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Report</Text>

            <View style={styles.formatOptions}>
              {(['pdf', 'csv', 'json'] as const).map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatOption,
                    exportFormat === format && styles.formatOptionSelected,
                  ]}
                  onPress={() => setExportFormat(format)}
                >
                  <Text
                    style={[
                      styles.formatOptionText,
                      exportFormat === format && styles.formatOptionTextSelected,
                    ]}
                  >
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleExport}>
              <Text style={styles.modalButtonText}>⬇️ Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  exportIcon: {
    fontSize: 18,
  },
  tabBar: {
    backgroundColor: 'white',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#2563eb',
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
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  reportStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailTitle: {
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
  performanceCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  perfLabel: {
    fontSize: 12,
    color: '#166534',
  },
  perfValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  exportCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#2563eb',
    marginBottom: 12,
  },
  exportButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  exportButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
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
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formatOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  formatOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  formatOptionTextSelected: {
    color: 'white',
  },
  modalButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

export default AdvancedReportViewer;
