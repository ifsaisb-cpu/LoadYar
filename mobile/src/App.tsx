import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from './store/authStore';
import { useTripsStore } from './store/tripsStore';
import { useGpsStore } from './store/gpsStore';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TripDetailsScreen from './screens/TripDetailsScreen';
import type { Trip } from './store/tripsStore';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'home' | 'tripDetails'>('login');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();
  const { loadFromOfflineStorage } = useTripsStore();
  const { loadTrackingHistory } = useGpsStore();

  // Load stored data on app startup
  useEffect(() => {
    const initializeApp = async () => {
      await loadFromStorage();
      await loadFromOfflineStorage();
      await loadTrackingHistory();
    };

    initializeApp();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleLoginSuccess = () => {
    setCurrentScreen('home');
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    setCurrentScreen('tripDetails');
  };

  const handleBackFromTripDetails = () => {
    setSelectedTrip(null);
    setCurrentScreen('home');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 4,
            borderColor: '#2563eb',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} />}
      {currentScreen === 'home' && <HomeScreen onTripSelect={handleTripSelect} />}
      {currentScreen === 'tripDetails' && selectedTrip && (
        <TripDetailsScreen trip={selectedTrip} onBack={handleBackFromTripDetails} />
      )}
    </View>
  );
}
