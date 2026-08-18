import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useTripsStore } from '../store/tripsStore';
import { useGpsStore } from '../store/gpsStore';
import type { Trip } from '../store/tripsStore';

export const HomeScreen = ({ onTripSelect }: { onTripSelect: (trip: Trip) => void }) => {
  const { driver, logout } = useAuthStore();
  const { activeTrips, isLoading, fetchActiveTrips, setSelectedTrip } = useTripsStore();
  const { currentLocation, isTracking, startTracking } = useGpsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (driver) {
      fetchActiveTrips(driver.id);
      startTracking(); // Start GPS tracking
    }
  }, [driver]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (driver) {
      await fetchActiveTrips(driver.id);
    }
    setRefreshing(false);
  };

  const handleTripPress = (trip: Trip) => {
    setSelectedTrip(trip);
    onTripSelect(trip);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      { text: 'Logout', onPress: () => logout(), style: 'destructive' },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return '#2563eb';
      case 'pickedup':
        return '#f59e0b';
      case 'in_transit':
        return '#8b5cf6';
      case 'delivered':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      assigned: 'Assigned',
      pickedup: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const renderTripCard = ({ item: trip }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => handleTripPress(trip)}
    >
      <View style={styles.tripHeader}>
        <View>
          <Text style={styles.tripNumber}>{trip.trip_number}</Text>
          <Text style={styles.customer}>{trip.customer_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(trip.status)}</Text>
        </View>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.location}>
          <Text style={styles.locationLabel}>📍 Pickup</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.pickup_location}
          </Text>
        </View>
        <View style={styles.location}>
          <Text style={styles.locationLabel}>🎯 Delivery</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {trip.delivery_location}
          </Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <Text style={styles.cargo}>{trip.cargo_description}</Text>
        <Text style={styles.rate}>PKR {trip.rate.toLocaleString()}</Text>
      </View>

      {trip.priority === 'high' || trip.priority === 'urgent' ? (
        <View style={[styles.priorityBadge, { backgroundColor: trip.priority === 'urgent' ? '#ef4444' : '#f59e0b' }]}>
          <Text style={styles.priorityText}>
            {trip.priority === 'urgent' ? '🚨' : '⚠️'} {trip.priority.toUpperCase()}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 Welcome Back</Text>
          <Text style={styles.driverName}>{driver?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Status */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.statusIndicator, { backgroundColor: isTracking ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            GPS {isTracking ? 'Active' : 'Inactive'}
          </Text>
        </View>
        {currentLocation && (
          <Text style={styles.statusCoords}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Trips List */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : activeTrips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>📭 No active trips</Text>
          <Text style={styles.emptySubtext}>Check back later for new assignments</Text>
        </View>
      ) : (
        <FlatList
          data={activeTrips}
          renderItem={renderTripCard}
          keyExtractor={(trip) => trip.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563eb" />
          }
        />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  logoutButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBar: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusCoords: {
    fontSize: 12,
    color: '#666',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    padding: 12,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  customer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tripDetails: {
    marginBottom: 12,
    gap: 10,
  },
  location: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cargo: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  rate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priorityBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default HomeScreen;
