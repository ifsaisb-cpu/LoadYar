import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView } from 'expo-camera';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onCancel,
  title = 'Scan QR Code',
  subtitle = 'Position the QR code in the camera view',
}) => {
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      onScanSuccess(data);

      // Reset after 1 second to allow multiple scans
      setTimeout(() => setScanned(false), 1000);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scanner Frame */}
        <View style={styles.scannerArea}>
          <View style={styles.scanFrame} />
          <View style={styles.frameCornerTopLeft} />
          <View style={styles.frameCornerTopRight} />
          <View style={styles.frameCornerBottomLeft} />
          <View style={styles.frameCornerBottomRight} />
        </View>

        {/* Instructions */}
        <View style={styles.footer}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {scanned && (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>✓ QR Code Scanned</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scannerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  frameCornerTopLeft: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#2563eb',
  },
  frameCornerTopRight: {
    position: 'absolute',
    top: '25%',
    right: '25%',
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#2563eb',
  },
  frameCornerBottomLeft: {
    position: 'absolute',
    bottom: '25%',
    left: '25%',
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#2563eb',
  },
  frameCornerBottomRight: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#2563eb',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  successMessage: {
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});

export default QRScanner;
