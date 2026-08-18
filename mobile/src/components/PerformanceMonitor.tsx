import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { cacheService } from '../services/cacheService';
import { queryOptimizer } from '../services/queryOptimizer';
import type { CacheStats } from '../services/cacheService';
import type { QueryOptimizationStats } from '../services/queryOptimizer';

interface PerformanceMonitorProps {
  onClose: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ onClose }) => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [queryStats, setQueryStats] = useState<QueryOptimizationStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState<'cache' | 'query' | null>(null);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    setCacheStats(cacheService.getStats());
    setQueryStats(queryOptimizer.getStats());
  };

  const handleClearCache = () => {
    cacheService.clear();
    updateStats();
  };

  const handleResetStats = () => {
    queryOptimizer.resetStats();
    cacheService.resetStats();
    updateStats();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚡ Performance Monitor</Text>
        <TouchableOpacity onPress={updateStats}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cache Performance */}
        {cacheStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💾 Cache Performance</Text>
              <TouchableOpacity onPress={() => setShowDetails('cache')}>
                <Text style={styles.detailsIcon}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Hit Rate</Text>
                <Text style={[styles.metricValue, { color: '#10b981' }]}>
                  {cacheStats.hitRate.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Miss Rate</Text>
                <Text style={[styles.metricValue, { color: '#ef4444' }]}>
                  {cacheStats.missRate.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Entries</Text>
                <Text style={styles.metricValue}>{cacheStats.totalEntries}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cache Size</Text>
                <Text style={styles.metricValue}>{formatBytes(cacheStats.totalSize)}</Text>
              </View>
            </View>

            {/* Cache Hit Rate Progress */}
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>Hit Rate Trend</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${cacheStats.hitRate}%`,
                      backgroundColor: cacheStats.hitRate > 70 ? '#10b981' : '#f59e0b'
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {cacheStats.hitRate > 70 ? '✓ Excellent' : '⚠️ Can improve'}
              </Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
              <Text style={styles.actionButtonText}>🗑️ Clear Cache</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Query Performance */}
        {queryStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Query Performance</Text>
              <TouchableOpacity onPress={() => setShowDetails('query')}>
                <Text style={styles.detailsIcon}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Queries</Text>
                <Text style={styles.metricValue}>{queryStats.totalQueries}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Avg Time</Text>
                <Text style={styles.metricValue}>{queryStats.averageExecutionTime.toFixed(0)}ms</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cache Hit</Text>
                <Text style={[styles.metricValue, { color: '#10b981' }]}>
                  {queryStats.cacheHitRate.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Slowest</Text>
                <Text style={styles.metricValue}>
                  {queryStats.slowestQueries[0]?.executionTime.toFixed(0) || 0}ms
                </Text>
              </View>
            </View>

            {/* Slowest Queries */}
            {queryStats.slowestQueries.length > 0 && (
              <View style={styles.slowQueriesCard}>
                <Text style={styles.slowQueriesTitle}>🐌 Slowest Queries</Text>
                {queryStats.slowestQueries.slice(0, 3).map((query, index) => (
                  <View key={index} style={styles.queryRow}>
                    <View style={styles.queryInfo}>
                      <Text style={styles.queryIndex}>#{index + 1}</Text>
                      <View style={styles.queryDetails}>
                        <Text style={styles.queryName} numberOfLines={1}>
                          {query.query.substring(0, 40)}...
                        </Text>
                        <Text style={styles.queryTime}>{query.executionTime.toFixed(2)}ms</Text>
                      </View>
                    </View>
                    {query.cacheHit ? (
                      <Text style={styles.hitBadge}>💾 Hit</Text>
                    ) : (
                      <Text style={styles.missBadge}>🔄 Miss</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Optimization Suggestions */}
            {queryStats.optimizationSuggestions.length > 0 && (
              <View style={styles.suggestionsCard}>
                <Text style={styles.suggestionsTitle}>💡 Optimization Tips</Text>
                {queryStats.optimizationSuggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionRow}>
                    <Text style={styles.suggestionIcon}>→</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={handleResetStats}>
              <Text style={styles.actionButtonText}>↻ Reset Stats</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Performance Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📈 Performance Best Practices</Text>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Cache hit rate should be > 70% for optimal performance</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Average query time under 100ms is ideal</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Keep cache size under 50MB for mobile devices</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Batch queries when possible to reduce overhead</Text>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>Prefetch critical data during idle time</Text>
          </View>
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={showDetails !== null} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetails(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {showDetails === 'cache' ? '💾 Cache Details' : '📊 Query Details'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody}>
              {showDetails === 'cache' && cacheStats && (
                <View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Cache Layers</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Memory Cache</Text>
                      <Text style={styles.detailValue}>50 MB max</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Persistent Cache</Text>
                      <Text style={styles.detailValue}>100 MB max</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>AsyncStorage</Text>
                      <Text style={styles.detailValue}>Unlimited</Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Eviction Strategy</Text>
                    <Text style={styles.detailDescription}>
                      LRU (Least Recently Used): Entries are evicted based on a score that combines hit count and age. Frequently accessed and recent entries stay in cache.
                    </Text>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Statistics</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Hits</Text>
                      <Text style={styles.detailValue}>Tracked</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hit Rate</Text>
                      <Text style={styles.detailValue}>{cacheStats.hitRate.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Avg Hits</Text>
                      <Text style={styles.detailValue}>{cacheStats.averageHits.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {showDetails === 'query' && queryStats && (
                <View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Query Optimization</Text>
                    <Text style={styles.detailDescription}>
                      Queries are cached based on strategy. Report queries cache for 30 min, real-time queries for 2 sec, and master data for 1 hour.
                    </Text>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Batching Strategy</Text>
                    <Text style={styles.detailDescription}>
                      Multiple queries are batched together and executed in a single roundtrip when possible. High-priority queries bypass batching.
                    </Text>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Performance Metrics</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Queries</Text>
                      <Text style={styles.detailValue}>{queryStats.totalQueries}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Avg Execution</Text>
                      <Text style={styles.detailValue}>{queryStats.averageExecutionTime.toFixed(2)}ms</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cache Benefit</Text>
                      <Text style={styles.detailValue}>{queryStats.cacheHitRate.toFixed(1)}%</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
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
  detailsIcon: {
    fontSize: 18,
    color: '#2563eb',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  progressCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  slowQueriesCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  slowQueriesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 10,
  },
  queryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
  },
  queryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queryIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginRight: 8,
  },
  queryDetails: {
    flex: 1,
  },
  queryName: {
    fontSize: 11,
    color: '#666',
  },
  queryTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  hitBadge: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  missBadge: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },
  suggestionsCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 10,
  },
  suggestionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 12,
    color: '#f59e0b',
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 11,
    color: '#92400e',
    flex: 1,
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
    padding: 12,
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  detailDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default PerformanceMonitor;
