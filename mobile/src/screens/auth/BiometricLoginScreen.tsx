import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { biometricService } from '../../services/biometric';
import { useAuthStore } from '../../store/auth';
import { toastService } from '../../services/toast';

export default function BiometricLoginScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const { login } = useAuthStore();

  useEffect(() => {
    loadBiometricConfig();
  }, []);

  const loadBiometricConfig = async () => {
    try {
      await biometricService.initialize();
      const biometricConfig = await biometricService.getConfiguration();
      setConfig(biometricConfig);
      setIsLoading(false);

      // Auto-attempt biometric login if enabled
      if (biometricConfig.enabled) {
        setTimeout(() => attemptBiometricLogin(), 500);
      }
    } catch (error: any) {
      toastService.error('Failed to initialize biometric');
      setIsLoading(false);
    }
  };

  const attemptBiometricLogin = async () => {
    setAuthenticating(true);
    try {
      const isBiometricEnabled = await biometricService.isBiometricEnabled();

      if (!isBiometricEnabled) {
        setAuthenticating(false);
        return;
      }

      const authenticated = await biometricService.authenticate(
        'Login to LoadYar with biometric'
      );

      if (!authenticated) {
        setAuthenticating(false);
        return;
      }

      const credentials = await biometricService.getBiometricCredentials();

      if (!credentials) {
        toastService.error('Failed to retrieve credentials');
        setAuthenticating(false);
        return;
      }

      // Login with retrieved credentials
      await login(credentials.username, credentials.password);
    } catch (error: any) {
      const message = error.message || 'Biometric authentication failed';

      if (message === 'Authentication cancelled' || message === 'Fallback to passcode') {
        // User cancelled, stay on this screen
        setAuthenticating(false);
      } else {
        toastService.error(message);
        setAuthenticating(false);
      }
    }
  };

  const getBiometricIcon = (biometryType: string | null): string => {
    switch (biometryType) {
      case 'fingerprint':
        return '👆';
      case 'facial':
        return '🔍';
      case 'iris':
        return '👁️';
      default:
        return '🔐';
    }
  };

  const getBiometricLabel = (biometryType: string | null): string => {
    switch (biometryType) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'facial':
        return 'Face ID';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  if (!config?.enabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Biometric Not Available</Text>
          <Text style={styles.message}>
            Your device doesn't have biometric authentication enabled
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Use Password Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {getBiometricIcon(config.biometryType)}
        </Text>

        <Text style={styles.title}>LoadYar</Text>
        <Text style={styles.subtitle}>Login with {getBiometricLabel(config.biometryType)}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Use {getBiometricLabel(config.biometryType)} to quickly access your account
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.authenticateBtn, authenticating && styles.authenticateBtnDisabled]}
          onPress={attemptBiometricLogin}
          disabled={authenticating}
        >
          {authenticating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.authenticateBtnIcon}>
                {getBiometricIcon(config.biometryType)}
              </Text>
              <Text style={styles.authenticateBtnText}>
                Login with {getBiometricLabel(config.biometryType)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.alternateBtn}
          onPress={() => navigation.navigate('Login')}
          disabled={authenticating}
        >
          <Text style={styles.alternateBtnText}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  authenticateBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  authenticateBtnDisabled: {
    opacity: 0.6,
  },
  authenticateBtnIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  authenticateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alternateBtn: {
    paddingVertical: 12,
  },
  alternateBtnText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
});
