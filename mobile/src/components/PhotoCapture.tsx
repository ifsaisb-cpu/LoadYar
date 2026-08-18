import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';
import { useDeliveryStore } from '../store/deliveryStore';
import type { DeliveryPhoto } from '../store/deliveryStore';

interface PhotoCaptureProps {
  type: 'pickup' | 'cargo' | 'delivery' | 'damage';
  onPhotoCaptured: (photo: DeliveryPhoto) => void;
  onCancel: () => void;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  type,
  onPhotoCaptured,
  onCancel,
}) => {
  const [mode, setMode] = useState<'camera' | 'review'>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const cameraRef = useRef(null);

  const typeLabels = {
    pickup: '📦 Pickup Proof',
    cargo: '📸 Cargo Photo',
    delivery: '✅ Delivery Proof',
    damage: '⚠️ Damage Report',
  };

  const handleTakePhoto = async () => {
    try {
      const result = await (cameraRef.current as any)?.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (result) {
        setPhoto(result.uri);
        setMode('review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        setMode('review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleConfirmPhoto = () => {
    if (!photo) return;

    const deliveryPhoto: DeliveryPhoto = {
      id: `${Date.now()}_${Math.random()}`,
      uri: photo,
      timestamp: Date.now(),
      type,
      caption: caption || undefined,
    };

    onPhotoCaptured(deliveryPhoto);
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setCaption('');
    setMode('camera');
  };

  if (mode === 'review' && photo) {
    return (
      <View style={styles.reviewContainer}>
        <View style={styles.reviewHeader}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Review Photo</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.reviewContent}>
          <Image source={{ uri: photo }} style={styles.previewImage} />

          <View style={styles.captionBox}>
            <Text style={styles.captionLabel}>Caption (Optional)</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Add notes about this photo..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={handleRetakePhoto}
            >
              <Text style={styles.retakeButtonText}>📸 Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirmPhoto}
            >
              <Text style={styles.confirmButtonText}>✓ Use Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{typeLabels[type]}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Footer Controls */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickFromGallery}
          >
            <Text style={styles.galleryButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePhoto}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={{ width: 60 }} />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  reviewHeader: {
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
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  galleryButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  reviewContent: {
    flex: 1,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  captionBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    fontWeight: '600',
  },
  retakeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  retakeButtonText: {
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

export default PhotoCapture;
