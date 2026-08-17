import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocationStore } from '../../store/location';
import { locationService } from '../../services/location';

export default function LocationTrackingScreen({ route }: any) {
  const { tripId } = route.params;
  const {
    currentLocation,
    isTracking,
    distanceTraveled,
    tripLocations,
    trackingStartTime,
    requestLocationPermission,
    startTracking,
    stopTracking,
    getCurrentLocation,
  } = useLocationStore();

  useEffect(() => {
    checkPermissionsAndLoad();
  }, []);

  const checkPermissionsAndLoad = async () => {
    await requestLocationPermission();
    await getCurrentLocation();
  };

  const handleStartTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required for tracking');
      return;
    }
    await startTracking(tripId);
  };

  const handleStopTracking = async () => {
    Alert.alert('Stop Tracking', 'End trip tracking?', [
      { text: 'Cancel' },
      {
        text: 'Stop',
        onPress: async () => {
          await stopTracking(tripId);
          Alert.alert('Tracking stopped', `Distance: ${distanceTraveled.toFixed(2)} km`);
        },
      },
    ]);
  };

  const formatDuration = (startTime: number | null): string => {
    if (!startTime) return '--:--';

    const elapsed = Date.now() - startTime;
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  };

  const formatSpeed = (speed: number | null): string => {
    if (speed === null) return '0.0 km/h';
    return `${(speed * 3.6).toFixed(1)} km/h`;
  };

  const formatAccuracy = (accuracy: number | null): string => {
    if (accuracy === null) return '-- m';
    return `${Math.round(accuracy)} m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Location Card */}
        {currentLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Current Location</Text>

            <View style={styles.coordinateRow}>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <Text style={styles.coordinateValue}>
                  {currentLocation.latitude.toFixed(6)}°
                </Text>
              </View>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <Text style={styles.coordinateValue}>
                  {currentLocation.longitude.toFixed(6)}°
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Accuracy</Text>
              <Text style={styles.infoValue}>
                {formatAccuracy(currentLocation.accuracy)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Altitude</Text>
              <Text style={styles.infoValue}>
                {currentLocation.altitude
                  ? `${currentLocation.altitude.toFixed(1)} m`
                  : '-- m'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Speed</Text>
              <Text style={styles.infoValue}>
                {formatSpeed(currentLocation.speed)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Heading</Text>
              <Text style={styles.infoValue}>
                {currentLocation.heading
                  ? `${currentLocation.heading.toFixed(0)}°`
                  : '-- °'}
              </Text>
            </View>
          </View>
        )}

        {/* Tracking Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Trip Stats</Text>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(trackingStartTime)}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distanceTraveled.toFixed(2)} km</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Locations Recorded</Text>
            <Text style={styles.statValue}>{tripLocations.length}</Text>
          </View>

          {tripLocations.length > 0 && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg Speed</Text>
              <Text style={styles.statValue}>
                {trackingStartTime
                  ? (
                      (distanceTraveled * 1000) /
                      (Date.now() - trackingStartTime)
                    ).toFixed(1)
                  : '0.0'}{' '}
                km/h
              </Text>
            </View>
          )}
        </View>

        {/* Tracking Status */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIndicator,
              isTracking && styles.statusIndicatorActive,
            ]}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
            </Text>
            <Text style={styles.statusDescription}>
              {isTracking
                ? `${tripLocations.length} locations recorded`
                : 'Start tracking to record trip data'}
            </Text>
          </View>
          {isTracking && <ActivityIndicator color="#4CAF50" size="small" />}
        </View>

        {/* Map Preview (Future Enhancement) */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>📍 Map Preview</Text>
          <Text style={styles.mapSubtext}>
            {tripLocations.length > 1
              ? `Route with ${tripLocations.length} waypoints`
              : 'Map visualization coming soon'}
          </Text>
        </View>
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartTracking}
          >
            <Text style={styles.buttonText}>▶ Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopBtn} onPress={handleStopTracking}>
            <Text style={styles.buttonText}>⏹ Stop Tracking</Text>
          </TouchableOpacity>
        )}
      </View>
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
    paddingHorizontal: 12,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  coordinateItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 4,
  },
  coordinateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066cc',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#999',
    marginRight: 12,
  },
  statusIndicatorActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 12,
    color: '#666',
  },
  mapPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: 24,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
