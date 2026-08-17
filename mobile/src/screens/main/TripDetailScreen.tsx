import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTripsStore } from '../../store/trips';

export default function TripDetailScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const { currentTrip, fetchTripById, updateTripStatus, isLoading } = useTripsStore();

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  if (isLoading || !currentTrip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    Alert.alert('Update Status', `Change status to ${newStatus}?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateTripStatus(currentTrip.id, newStatus);
            Alert.alert('Success', 'Trip status updated');
          } catch (error: any) {
            Alert.alert('Error', 'Failed to update trip status');
          }
        },
      },
    ]);
  };

  const getNextStatus = () => {
    const statusFlow: any = {
      booked: 'in_transit',
      in_transit: 'delivered',
      delivered: 'closed',
      closed: null,
    };
    return statusFlow[currentTrip.status];
  };

  const nextStatus = getNextStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.biltyNo}>{currentTrip.bilty_no}</Text>
              <Text style={styles.date}>
                {new Date(currentTrip.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles[`status_${currentTrip.status}` as keyof typeof styles]]}>
              <Text style={styles.statusText}>{currentTrip.status}</Text>
            </View>
          </View>
        </View>

        {/* Trip Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Consignee</Text>
            <Text style={styles.value}>{currentTrip.consignee}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Freight Amount</Text>
            <Text style={styles.valueHighlight}>₨ {(currentTrip.freight_paisa / 100).toLocaleString()}</Text>
          </View>
          {currentTrip.route && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Route</Text>
              <Text style={styles.value}>{currentTrip.route}</Text>
            </View>
          )}
        </View>

        {/* Vehicle Details */}
        {currentTrip.carrier_id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carrier & Driver</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Carrier ID</Text>
              <Text style={styles.value}>{currentTrip.carrier_id}</Text>
            </View>
            {currentTrip.driver_id && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Driver ID</Text>
                <Text style={styles.value}>{currentTrip.driver_id}</Text>
              </View>
            )}
          </View>
        )}

        {/* Status Update */}
        {nextStatus && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => handleStatusChange(nextStatus)}
            >
              <Text style={styles.updateButtonText}>
                Mark as {nextStatus.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  biltyNo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  valueHighlight: {
    fontSize: 13,
    color: '#0066cc',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  updateButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
