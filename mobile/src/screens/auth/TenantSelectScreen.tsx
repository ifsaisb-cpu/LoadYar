import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../services/api';

export default function TenantSelectScreen({ navigation }: any) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { selectTenant } = useAuthStore();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await apiClient.get('/auth/tenants');
      setTenants(response.data);
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load tenants');
      setLoading(false);
    }
  };

  const handleSelectTenant = async (tenantId: number) => {
    setSelectedId(tenantId);
    try {
      await selectTenant(tenantId);
      // Navigation handled by RootNavigator
    } catch (error: any) {
      Alert.alert('Error', 'Failed to select tenant');
      setSelectedId(null);
    }
  };

  if (loading) {
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
      <View style={styles.header}>
        <Text style={styles.title}>Select Workspace</Text>
        <Text style={styles.subtitle}>Choose which tenant to work with</Text>
      </View>

      <FlatList
        data={tenants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tenantCard,
              selectedId === item.id && styles.tenantCardSelected,
            ]}
            onPress={() => handleSelectTenant(item.id)}
            disabled={loading && selectedId === item.id}
          >
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantName}>{item.name}</Text>
              <Text style={styles.tenantSlug}>{item.slug}</Text>
            </View>
            {selectedId === item.id && (
              <ActivityIndicator color="#0066cc" size="small" />
            )}
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tenantCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tenantCardSelected: {
    borderColor: '#0066cc',
    borderWidth: 2,
    backgroundColor: '#f0f7ff',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tenantSlug: {
    fontSize: 12,
    color: '#999',
  },
});
