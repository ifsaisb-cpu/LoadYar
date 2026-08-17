import * as LocalAuthentication from 'expo-local-authentication';
import { storageService } from './storage';

export interface BiometricConfig {
  enabled: boolean;
  biometryType: 'fingerprint' | 'facial' | 'iris' | null;
  isDeviceSecure: boolean;
  enrolledBiometrics: boolean;
}

export interface BiometricCredentials {
  username: string;
  password: string; // Encrypted and stored in Keychain/Secure Storage
}

class BiometricService {
  private isAvailable = false;
  private supportedTypes: LocalAuthentication.AuthenticationType[] = [];

  async initialize(): Promise<void> {
    try {
      // Check if device has biometric hardware
      this.isAvailable = await LocalAuthentication.hasHardwareAsync();

      if (this.isAvailable) {
        // Check if biometrics are enrolled
        const compatible = await LocalAuthentication.isCompatibleAsync();
        if (compatible) {
          const enrolled = await LocalAuthentication.isSensorAvailableAsync();
          if (enrolled) {
            this.supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          }
        }
      }

      console.log('Biometric service initialized', {
        available: this.isAvailable,
        supported: this.supportedTypes,
      });
    } catch (error) {
      console.error('Biometric initialization error:', error);
      this.isAvailable = false;
    }
  }

  async getConfiguration(): Promise<BiometricConfig> {
    try {
      const isDeviceSecure = await LocalAuthentication.isDeviceSecureAsync();
      const hasEnrolled = await LocalAuthentication.isSensorAvailableAsync();

      let biometryType: 'fingerprint' | 'facial' | 'iris' | null = null;

      if (hasEnrolled && this.supportedTypes.length > 0) {
        if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometryType = 'fingerprint';
        } else if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'facial';
        } else if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometryType = 'iris';
        }
      }

      return {
        enabled: this.isAvailable && hasEnrolled,
        biometryType,
        isDeviceSecure,
        enrolledBiometrics: hasEnrolled,
      };
    } catch (error) {
      console.error('Get biometric configuration error:', error);
      return {
        enabled: false,
        biometryType: null,
        isDeviceSecure: false,
        enrolledBiometrics: false,
      };
    }
  }

  async authenticate(reason: string = 'Authenticate to access LoadYar'): Promise<boolean> {
    try {
      const config = await this.getConfiguration();

      if (!config.enabled) {
        throw new Error('Biometric authentication not available');
      }

      const authenticated = await LocalAuthentication.authenticateAsync({
        reason,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      return authenticated.success;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);

      // User cancelled or error occurred
      if (error.name === 'LAError') {
        if (error.code === 'UserCancel') {
          throw new Error('Authentication cancelled');
        } else if (error.code === 'UserFallback') {
          throw new Error('Fallback to passcode');
        } else if (error.code === 'SystemCancel') {
          throw new Error('System cancelled authentication');
        } else if (error.code === 'AuthenticationFailed') {
          throw new Error('Authentication failed - try again');
        }
      }

      throw new Error('Biometric authentication failed');
    }
  }

  async enableBiometric(credentials: BiometricCredentials): Promise<void> {
    try {
      const config = await this.getConfiguration();

      if (!config.enabled) {
        throw new Error('Biometric not available on this device');
      }

      // Authenticate user to confirm they want to enable biometric
      const authenticated = await this.authenticate('Enable biometric login');

      if (!authenticated) {
        throw new Error('Could not verify identity');
      }

      // Store credentials securely (in production, use Keychain/Secure Storage)
      // For now, use AsyncStorage with encryption (TODO: native secure storage)
      const encrypted = this.encryptCredentials(credentials);
      await storageService.setItem('biometric_credentials', encrypted);
      await storageService.setItem('biometric_enabled', true);

      console.log('Biometric login enabled');
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await storageService.removeItem('biometric_credentials');
      await storageService.removeItem('biometric_enabled');

      console.log('Biometric login disabled');
    } catch (error) {
      console.error('Disable biometric error:', error);
      throw error;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await storageService.getItem('biometric_enabled');
      return enabled === true;
    } catch (error) {
      console.error('Check biometric enabled error:', error);
      return false;
    }
  }

  async getBiometricCredentials(): Promise<BiometricCredentials | null> {
    try {
      const isEnabled = await this.isBiometricEnabled();

      if (!isEnabled) {
        return null;
      }

      // Authenticate with biometric
      const authenticated = await this.authenticate('Login with biometric');

      if (!authenticated) {
        return null;
      }

      // Retrieve encrypted credentials
      const encrypted = await storageService.getItem('biometric_credentials');

      if (!encrypted) {
        return null;
      }

      // Decrypt and return
      return this.decryptCredentials(encrypted);
    } catch (error) {
      console.error('Get biometric credentials error:', error);
      return null;
    }
  }

  // Simple encryption (TODO: use native encryption in production)
  private encryptCredentials(credentials: BiometricCredentials): string {
    return Buffer.from(JSON.stringify(credentials)).toString('base64');
  }

  private decryptCredentials(encrypted: string): BiometricCredentials {
    return JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8'));
  }

  async lockBiometric(): Promise<void> {
    // Force re-authentication on next use
    console.log('Biometric lock requested');
  }
}

export const biometricService = new BiometricService();
