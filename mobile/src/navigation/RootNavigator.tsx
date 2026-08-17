import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import TenantSelectScreen from '../screens/auth/TenantSelectScreen';
import TripsScreen from '../screens/main/TripsScreen';
import TripDetailScreen from '../screens/main/TripDetailScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import ChecklistScreen from '../screens/main/ChecklistScreen';
import ExpenseScreen from '../screens/main/ExpenseScreen';
import LocationTrackingScreen from '../screens/main/LocationTrackingScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  TenantSelect: undefined;
};

export type MainStackParamList = {
  TripsTab: undefined;
  TripDetail: { tripId: number };
  Checklist: { tripId: number };
  Expenses: { tripId: number };
  LocationTracking: { tripId: number };
  ProfileTab: undefined;
  SettingsTab: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="TenantSelect"
        component={TenantSelectScreen}
        options={{
          animationEnabled: false,
        }}
      />
    </AuthStack.Navigator>
  );
}

function TripsNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
      }}
    >
      <MainStack.Screen
        name="TripsTab"
        component={TripsScreen}
        options={{
          title: 'Trips',
        }}
      />
      <MainStack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{
          title: 'Trip Details',
        }}
      />
      <MainStack.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{
          title: 'Vehicle Checklist',
        }}
      />
      <MainStack.Screen
        name="Expenses"
        component={ExpenseScreen}
        options={{
          title: 'Trip Expenses',
        }}
      />
      <MainStack.Screen
        name="LocationTracking"
        component={LocationTrackingScreen}
        options={{
          title: 'GPS Tracking',
        }}
      />
    </MainStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#999999',
      }}
    >
      <Tab.Screen
        name="Trips"
        component={TripsNavigator}
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, token, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  const isLoggedIn = !!token && !!user;

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        {isLoggedIn ? (
          <RootStack.Screen
            name="Main"
            component={MainNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        ) : (
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animationEnabled: false,
            }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
