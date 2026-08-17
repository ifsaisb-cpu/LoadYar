import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  SectionList,
} from 'react-native';
import { useTripsStore } from '../../store/trips';
import { apiClient } from '../../services/api';

export default function TripsScreen({ navigation }: any) {
  const { trips, fetchTrips, isLoading } = useTripsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    await fetchTrips();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await apiClient.syncQueue();
      await loadTrips();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTrips = filter === 'all'
    ? trips
    : trips.filter((t) => t.status === filter);

  const groupedTrips = [
    {
      title: 'In Transit',
      data: filteredTrips.filter((t) => t.status === 'in_transit'),
    },
    {
      title: 'Booked',
      data: filteredTrips.filter((t) => t.status === 'booked'),
    },
    {
      title: 'Delivered',
      data: filteredTrips.filter((t) => t.status === 'delivered'),
    },
    {
      title: 'Closed',
      data: filteredTrips.filter((t) => t.status === 'closed'),
    },
  ].filter((group) => group.data.length > 0);

  const renderTrip = ({ item }: any) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.biltyNo}>{item.bilty_no}</Text>
        <View style={[styles.statusBadge, styles[`status_${item.status}` as keyof typeof styles]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.consignee}>{item.consignee}</Text>
      <View style={styles.tripFooter}>
        <Text style={styles.amount}>₨ {(item.freight_paisa / 100).toLocaleString()}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSection = ({ section }: any) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'in_transit' && styles.filterBtnActive]}
          onPress={() => setFilter('in_transit')}
        >
          <Text style={[styles.filterBtnText, filter === 'in_transit' && styles.filterBtnTextActive]}>
            In Transit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'booked' && styles.filterBtnActive]}
          onPress={() => setFilter('booked')}
        >
          <Text style={[styles.filterBtnText, filter === 'booked' && styles.filterBtnTextActive]}>
            Booked
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : filteredTrips.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No trips found</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedTrips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTrip}
          renderSectionHeader={renderSection}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  filterBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  biltyNo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status_booked: {
    backgroundColor: '#fff3cd',
  },
  status_in_transit: {
    backgroundColor: '#cfe2ff',
  },
  status_delivered: {
    backgroundColor: '#d1e7dd',
  },
  status_closed: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  consignee: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
