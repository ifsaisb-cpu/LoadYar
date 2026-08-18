import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Image,
} from 'react-native';
import type { Trip } from '../store/tripsStore';
import { useTripsStore } from '../store/tripsStore';

export const TripDetailsScreen = ({
  trip,
  onBack,
}: {
  trip: Trip;
  onBack: () => void;
}) => {
  const { updateTripStatus } = useTripsStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCallCustomer = () => {
    Linking.openURL(`tel:${trip.customer_phone}`);
  };

  const handleMessageCustomer = () => {
    Linking.openURL(`sms:${trip.customer_phone}`);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateTripStatus(trip.id, newStatus);
      Alert.alert('Success', `Trip status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update trip status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextActions = () => {
    const actions: { label: string; status: string; color: string }[] = [];

    switch (trip.status) {
      case 'assigned':
        actions.push(
          { label: '🚗 Start Trip', status: 'pickedup', color: '#f59e0b' },
          { label: '❌ Cancel', status: 'cancelled', color: '#ef4444' }
        );
        break;
      case 'pickedup':
        actions.push(
          { label: '🚙 Start Delivery', status: 'in_transit', color: '#8b5cf6' },
          { label: '❌ Cancel', status: 'cancelled', color: '#ef4444' }
        );
        break;
      case 'in_transit':
        actions.push(
          { label: '✅ Mark Delivered', status: 'delivered', color: '#10b981' },
          { label: '❌ Cancel', status: 'cancelled', color: '#ef4444' }
        );
        break;
    }

    return actions;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const distance = calculateDistance(
    trip.pickup_lat,
    trip.pickup_lng,
    trip.delivery_lat,
    trip.delivery_lng
  );

  const nextActions = getNextActions();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Card */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <View>
              <Text style={styles.tripNumber}>{trip.trip_number}</Text>
              <Text style={styles.customer}>{trip.customer_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(trip.status)}</Text>
            </View>
          </View>

          {trip.special_instructions && (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsLabel}>⚠️ Special Instructions</Text>
              <Text style={styles.instructions}>{trip.special_instructions}</Text>
            </View>
          )}
        </View>

        {/* Locations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Locations</Text>

          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>Pickup Location</Text>
            <Text style={styles.locationMain}>{trip.pickup_location}</Text>
            <Text style={styles.locationSub}>{trip.pickup_address}</Text>
            <Text style={styles.coordinates}>
              📌 {trip.pickup_lat.toFixed(4)}, {trip.pickup_lng.toFixed(4)}
            </Text>
          </View>

          <View style={styles.distanceBox}>
            <Text style={styles.distanceLabel}>Route Distance</Text>
            <Text style={styles.distanceValue}>{distance} km</Text>
          </View>

          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>Delivery Location</Text>
            <Text style={styles.locationMain}>{trip.delivery_location}</Text>
            <Text style={styles.locationSub}>{trip.delivery_address}</Text>
            <Text style={styles.coordinates}>
              📌 {trip.delivery_lat.toFixed(4)}, {trip.delivery_lng.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Cargo Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Cargo Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{trip.cargo_description}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>{trip.cargo_weight} kg</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{trip.customer_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{trip.customer_phone}</Text>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
              <Text style={styles.buttonText}>☎️ Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessageCustomer}>
              <Text style={styles.buttonText}>💬 Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Financial Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agreed Rate</Text>
            <Text style={[styles.detailValue, { color: '#10b981', fontWeight: '700' }]}>
              PKR {trip.rate.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority</Text>
            <Text style={[styles.detailValue, { color: getPriorityColor(trip.priority) }]}>
              {trip.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {nextActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Actions</Text>
            {nextActions.map((action) => (
              <TouchableOpacity
                key={action.status}
                style={[styles.actionButton, { borderColor: action.color }]}
                onPress={() => handleUpdateStatus(action.status)}
                disabled={isUpdating}
              >
                <Text style={[styles.actionButtonText, { color: action.color }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {trip.status === 'delivered' && (
          <View style={styles.completedBox}>
            <Text style={styles.completedText}>✅ Trip Completed!</Text>
            <Text style={styles.completedSubtext}>Great job. Ready for next trip?</Text>
          </View>
        )}

        {trip.status === 'cancelled' && (
          <View style={[styles.completedBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.completedText, { color: '#991b1b' }]}>❌ Trip Cancelled</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
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
    case 'cancelled':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    assigned: 'Assigned',
    pickedup: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '#ef4444';
    case 'high':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
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
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
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
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 6,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  locationBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  locationSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  coordinates: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  distanceBox: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#1e40af',
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButton: {
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  completedBox: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  completedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  completedSubtext: {
    fontSize: 14,
    color: '#15803d',
    marginTop: 4,
  },
});

export default TripDetailsScreen;
