import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { mapService, CachedRegion } from '../../services/maps';
import { toastService } from '../../services/toast';

const PRESET_REGIONS = [
  {
    id: 'islamabad',
    name: 'Islamabad',
    bounds: { north: 33.9, south: 33.6, east: 73.3, west: 73.0 },
  },
  {
    id: 'lahore',
    name: 'Lahore',
    bounds: { north: 31.6, south: 31.4, east: 74.4, west: 74.1 },
  },
  {
    id: 'karachi',
    name: 'Karachi',
    bounds: { north: 25.0, south: 24.7, east: 67.3, west: 66.8 },
  },
  {
    id: 'multan',
    name: 'Multan',
    bounds: { north: 30.3, south: 30.0, east: 71.5, west: 71.2 },
  },
  {
    id: 'faisalabad',
    name: 'Faisalabad',
    bounds: { north: 31.5, south: 31.3, east: 73.0, west: 72.7 },
  },
];

export default function MapsScreen() {
  const [cachedRegions, setCachedRegions] = useState<CachedRegion[]>([]);
  const [cacheSize, setCacheSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingRegion, setDownloadingRegion] = useState<string | null>(null);

  useEffect(() => {
    loadCachedRegions();
  }, []);

  const loadCachedRegions = async () => {
    try {
      await mapService.init();
      const regions = await mapService.getCachedRegions();
      setCachedRegions(regions);

      const size = await mapService.getCacheSize();
      setCacheSize(size);
    } catch (error: any) {
      toastService.error('Failed to load cached regions');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownloadRegion = async (region: (typeof PRESET_REGIONS)[0]) => {
    const isAlreadyCached = cachedRegions.some((r) => r.id === region.id);
    if (isAlreadyCached) {
      Alert.alert('Already Downloaded', `${region.name} is already cached.`);
      return;
    }

    Alert.alert('Download Map', `Download ${region.name} for offline use? (~5-10 MB)`, [
      { text: 'Cancel' },
      {
        text: 'Download',
        onPress: async () => {
          try {
            setDownloadingRegion(region.id);
            const downloaded = await mapService.downloadRegion(
              region.id,
              region.name,
              region.bounds,
              [10, 11, 12, 13, 14]
            );

            setCachedRegions([...cachedRegions, downloaded]);
            const size = await mapService.getCacheSize();
            setCacheSize(size);

            toastService.success(`${region.name} downloaded successfully`);
          } catch (error: any) {
            toastService.error(`Failed to download ${region.name}`);
          } finally {
            setDownloadingRegion(null);
          }
        },
      },
    ]);
  };

  const handleDeleteRegion = (id: string, name: string) => {
    Alert.alert('Delete Map', `Remove ${name} from offline storage?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await mapService.deleteRegion(id);
            setCachedRegions(cachedRegions.filter((r) => r.id !== id));

            const size = await mapService.getCacheSize();
            setCacheSize(size);

            toastService.success(`${name} deleted`);
          } catch (error: any) {
            toastService.error('Failed to delete map');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleClearAllMaps = () => {
    Alert.alert('Clear All Maps', 'Remove all downloaded maps?', [
      { text: 'Cancel' },
      {
        text: 'Clear All',
        onPress: async () => {
          try {
            await mapService.clearCache();
            setCachedRegions([]);
            setCacheSize(0);
            toastService.success('All maps cleared');
          } catch (error: any) {
            toastService.error('Failed to clear maps');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderCachedRegion = ({ item }: { item: CachedRegion }) => (
    <View style={styles.cachedCard}>
      <View style={styles.cachedInfo}>
        <Text style={styles.cachedName}>{item.name}</Text>
        <Text style={styles.cachedMeta}>
          {item.tiles.length} tiles • {formatBytes(item.sizeBytes)}
        </Text>
        <Text style={styles.cachedDate}>
          Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteRegion(item.id, item.name)}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPresetRegion = ({ item }: { item: (typeof PRESET_REGIONS)[0] }) => {
    const isCached = cachedRegions.some((r) => r.id === item.id);
    const isDownloading = downloadingRegion === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.presetCard,
          isCached && styles.presetCardCached,
        ]}
        onPress={() => !isCached && handleDownloadRegion(item)}
        disabled={isCached}
      >
        <Text style={styles.presetName}>{item.name}</Text>
        {isCached && <Text style={styles.cachedLabel}>✓ Cached</Text>}
        {isDownloading && <ActivityIndicator size="small" color="#0066cc" />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Offline Maps</Text>
          <Text style={styles.headerSubtitle}>Download maps for offline navigation</Text>
        </View>

        {/* Cache Info */}
        {cacheSize > 0 && (
          <View style={styles.cacheInfo}>
            <View>
              <Text style={styles.cacheLabel}>Storage Used</Text>
              <Text style={styles.cacheSize}>{formatBytes(cacheSize)}</Text>
            </View>
            {cachedRegions.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearAllMaps}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cached Maps */}
        {cachedRegions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Downloaded</Text>
            <FlatList
              data={cachedRegions}
              keyExtractor={(item) => item.id}
              renderItem={renderCachedRegion}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        )}

        {/* Available Maps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Maps ({PRESET_REGIONS.length})
          </Text>
          <Text style={styles.sectionDescription}>
            Download maps for offline use. Each region is approximately 5-10 MB.
          </Text>

          <View style={styles.presetsGrid}>
            {PRESET_REGIONS.map((region) => (
              <View key={region.id} style={styles.presetContainer}>
                <TouchableOpacity
                  style={[
                    styles.presetCard,
                    cachedRegions.some((r) => r.id === region.id) &&
                      styles.presetCardCached,
                  ]}
                  onPress={() =>
                    !cachedRegions.some((r) => r.id === region.id) &&
                    handleDownloadRegion(region)
                  }
                  disabled={cachedRegions.some((r) => r.id === region.id)}
                >
                  <Text style={styles.presetName}>{region.name}</Text>
                  {cachedRegions.some((r) => r.id === region.id) && (
                    <Text style={styles.cachedLabel}>✓ Cached</Text>
                  )}
                  {downloadingRegion === region.id && (
                    <ActivityIndicator size="small" color="#0066cc" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Offline Maps</Text>
          <Text style={styles.infoText}>
            • Download maps before traveling to remote areas
          </Text>
          <Text style={styles.infoText}>
            • Maps are stored locally and do not use internet
          </Text>
          <Text style={styles.infoText}>
            • Cached maps show when you open the map view
          </Text>
          <Text style={styles.infoText}>
            • Storage is shared with other app data (AsyncStorage, SQLite)
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  cacheInfo: {
    backgroundColor: '#0066cc',
    margin: 12,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  cacheSize: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  clearBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  cachedCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cachedInfo: {
    flex: 1,
  },
  cachedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cachedMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cachedDate: {
    fontSize: 11,
    color: '#999',
  },
  deleteBtn: {
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    fontSize: 18,
    color: '#d32f2f',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetContainer: {
    width: '48%',
    marginBottom: 8,
  },
  presetCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetCardCached: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cachedLabel: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
});
