import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { PanResponder, Animated, GestureHandlerRootView } from 'react-native';

interface SignaturePadProps {
  onSignatureCapture: (signatureUri: string, signerName: string) => void;
  onCancel: () => void;
  title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureCapture,
  onCancel,
  title = 'Customer Signature',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signerName, setSignerName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const handleClear = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleConfirm = async () => {
    if (!signerName.trim()) {
      Alert.alert('Error', 'Please enter signer name');
      return;
    }

    if (canvasRef.current) {
      try {
        const signatureUri = canvasRef.current.toDataURL('image/png');
        onSignatureCapture(signatureUri, signerName);
      } catch (error) {
        Alert.alert('Error', 'Failed to capture signature');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Canvas for signature */}
      <View style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={350}
          height={200}
          style={styles.canvas}
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseMove={(e) => {
            if (!isDrawing || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.strokeStyle = '#1a1a1a';
              ctx.lineTo(x, y);
              ctx.stroke();
            }
          }}
        />
        <Text style={styles.signatureHint}>Sign above ☝️</Text>
      </View>

      {/* Signer Name Input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Signer Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full name"
          placeholderTextColor="#999"
          value={signerName}
          onChangeText={setSignerName}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClear}
        >
          <Text style={styles.clearButtonText}>🔄 Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.confirmButton]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>✓ Confirm</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  canvasContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  canvas: {
    width: '100%',
    height: 200,
    backgroundColor: 'white',
  },
  signatureHint: {
    textAlign: 'center',
    paddingBottom: 8,
    fontSize: 12,
    color: '#999',
  },
  formSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default SignaturePad;
