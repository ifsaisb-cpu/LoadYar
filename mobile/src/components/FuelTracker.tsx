import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useExpensesStore } from '../store/expensesStore';
import type { FuelEntry } from '../store/expensesStore';

interface FuelTrackerProps {
  driverId: number;
  onClose: () => void;
}

export const FuelTracker: React.FC<FuelTrackerProps> = ({ driverId, onClose }) => {
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | 'cng'>('petrol');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [stationName, setStationName] = useState('');
  const [notes, setNotes] = useState('');

  const { addFuelEntry, fuelEntries } = useExpensesStore();

  const handleAddFuel = () => {
    if (!liters || !cost || !odometerReading) {
      Alert.alert('Error', 'Please fill in liters, cost, and odometer reading');
      return;
    }

    const entry: Omit<FuelEntry, 'id'> = {
      driver_id: driverId,
      date: Date.now(),
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      fuel_type: fuelType,
      odometer_reading: parseInt(odometerReading),
      station_name: stationName || undefined,
      notes: notes || undefined,
    };

    addFuelEntry(entry);

    // Reset form
    setLiters('');
    setCost('');
    setOdometerReading('');
    setStationName('');
    setNotes('');

    Alert.alert('Success', 'Fuel entry recorded');
  };

  const todayEntries = fuelEntries.filter(
    (f) => new Date(f.date).toDateString() === new Date().toDateString() &&
           f.driver_id === driverId
  );

  const totalCost = todayEntries.reduce((sum, f) => sum + f.cost, 0);
  const totalLiters = todayEntries.reduce((sum, f) => sum + f.liters, 0);
  const costPerLiter = totalLiters > 0 ? (totalCost / totalLiters).toFixed(2) : '0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⛽ Fuel Tracking</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Today's Fuel Cost</Text>
            <Text style={styles.summaryValue}>PKR {totalCost.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Liters</Text>
            <Text style={styles.summaryValue}>{totalLiters.toFixed(1)}L</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cost per Liter</Text>
            <Text style={styles.summaryValue}>PKR {costPerLiter}</Text>
          </View>
        </View>

        {/* Entry Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add Fuel Entry</Text>

          {/* Fuel Type Selection */}
          <View style={styles.fuelTypeContainer}>
            {(['petrol', 'diesel', 'cng'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.fuelTypeButton,
                  fuelType === type && styles.fuelTypeButtonSelected,
                ]}
                onPress={() => setFuelType(type)}
              >
                <Text
                  style={[
                    styles.fuelTypeText,
                    fuelType === type && styles.fuelTypeTextSelected,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Liters</Text>
            <TextInput
              style={styles.input}
              placeholder="25"
              keyboardType="decimal-pad"
              value={liters}
              onChangeText={setLiters}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cost (PKR)</Text>
            <TextInput
              style={styles.input}
              placeholder="5000"
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Odometer Reading (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="15000"
              keyboardType="number-pad"
              value={odometerReading}
              onChangeText={setOdometerReading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Station (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Shell, Caltex, etc."
              value={stationName}
              onChangeText={setStationName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddFuel}>
            <Text style={styles.addButtonText}>+ Add Fuel Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Entries */}
        {todayEntries.length > 0 && (
          <View style={styles.entriesCard}>
            <Text style={styles.sectionTitle}>Today's Entries</Text>
            {todayEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryType}>{entry.fuel_type.toUpperCase()}</Text>
                  <Text style={styles.entryTime}>
                    {new Date(entry.date).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.entryStats}>
                  <Text style={styles.entryLiters}>{entry.liters}L</Text>
                  <Text style={styles.entryCost}>PKR {entry.cost}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  fuelTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  fuelTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  fuelTypeButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#e0f2fe',
  },
  fuelTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  fuelTypeTextSelected: {
    color: '#2563eb',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  entriesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryInfo: {
    flex: 1,
  },
  entryType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  entryTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  entryStats: {
    alignItems: 'flex-end',
  },
  entryLiters: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  entryCost: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default FuelTracker;
