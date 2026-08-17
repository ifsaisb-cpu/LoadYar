import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, BarCodeScanner } from 'expo-camera';
import { barcodeService } from '../../services/barcode';
import { toastService } from '../../services/toast';

export default function QRScannerScreen({ route, navigation }: any) {
  const { onScan, type = 'qr' } = route.params || {};
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const permissionResult = await barcodeService.requestPermission();
      setHasPermission(permissionResult);
    } catch (error: any) {
      toastService.error('Camera permission required');
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({ type: barcodeType, data }: any) => {
    if (scanned || isProcessing) {
      return;
    }

    setScanned(true);
    setIsProcessing(true);

    try {
      const parsed = barcodeService.parseBarcode(data, barcodeType);

      // For QR codes, try to parse as QR data
      if (type === 'qr') {
        const qrData = barcodeService.parseQRCode(data);
        const validation = barcodeService.validateQRCode(qrData);

        if (!validation.valid) {
          Alert.alert('Invalid QR Code', validation.errors.join('\n'), [
            {
              text: 'Try Again',
              onPress: () => setScanned(false),
            },
          ]);
          return;
        }

        if (onScan) {
          onScan(qrData);
        }

        toastService.success('QR code scanned successfully');
        navigation.goBack();
      } else {
        // For barcodes (product codes, etc.)
        const biltyResult = await barcodeService.scanBiltyNo(data);

        if (!biltyResult.valid) {
          Alert.alert('Invalid Barcode', 'Could not parse barcode data', [
            {
              text: 'Try Again',
              onPress: () => setScanned(false),
            },
          ]);
          return;
        }

        if (onScan) {
          onScan({ biltyNo: biltyResult.biltyNo, raw: data });
        }

        toastService.success(`Bilty scanned: ${biltyResult.biltyNo}`);
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Scan Error', error.message || 'Failed to process scan', [
        {
          text: 'Try Again',
          onPress: () => setScanned(false),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.icon}>📷</Text>
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.message}>
            We need access to your camera to scan {type === 'qr' ? 'QR codes' : 'barcodes'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestCameraPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        barCodeScannerSettings={{
          barCodeTypes: [type === 'qr' ? 'qr' : 'code128'],
        }}
        onBarcodeScanned={!scanned ? handleBarCodeScanned : undefined}
        flashMode={flashOn ? 'on' : 'off'}
      >
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {type === 'qr' ? 'Scan QR Code' : 'Scan Barcode'}
            </Text>
            <TouchableOpacity
              style={styles.flashBtn}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Text style={styles.flashBtnText}>
                {flashOn ? '💡' : '⚫'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerArea}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <Text style={styles.instruction}>
              {type === 'qr'
                ? 'Point at QR code'
                : 'Point at barcode'}
            </Text>
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          {/* Bottom Bar */}
          {isProcessing && (
            <View style={styles.processingBar}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.processingText}>Processing scan...</Text>
            </View>
          )}

          {scanned && !isProcessing && (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.scanAgainBtn}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainBtnText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 24,
    color: '#fff',
  },
  flashBtn: {
    padding: 8,
  },
  flashBtnText: {
    fontSize: 20,
  },
  scannerArea: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0066cc',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0066cc',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0066cc',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0066cc',
  },
  instruction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  processingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  processingText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 14,
  },
  actionBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanAgainBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scanAgainBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
