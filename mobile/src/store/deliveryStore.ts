import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeliveryPhoto {
  id: string;
  uri: string;
  timestamp: number;
  type: 'pickup' | 'cargo' | 'delivery' | 'damage';
  caption?: string;
}

export interface DeliverySignature {
  uri: string;
  timestamp: number;
  signer_name: string;
}

export interface ChecklistItem {
  id: number;
  label: string;
  checked: boolean;
  notes?: string;
  photo?: DeliveryPhoto;
}

export interface DeliveryProof {
  trip_id: number;
  pickup_verified: boolean;
  pickup_time?: number;
  pickup_signature?: DeliverySignature;
  photos: DeliveryPhoto[];
  checklist: ChecklistItem[];
  delivery_signature?: DeliverySignature;
  delivery_time?: number;
  customer_rating?: number;
  customer_feedback?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  sync_error?: string;
  created_at: number;
  updated_at: number;
}

interface DeliveryStore {
  currentDelivery: DeliveryProof | null;
  deliveryHistory: DeliveryProof[];
  isUploading: boolean;

  initializeDelivery: (trip_id: number) => void;
  addPhoto: (photo: DeliveryPhoto) => void;
  removePhoto: (photoId: string) => void;
  updateChecklistItem: (itemId: number, checked: boolean, notes?: string) => void;
  addChecklistPhoto: (itemId: number, photo: DeliveryPhoto) => void;
  addPickupSignature: (signature: DeliverySignature) => void;
  addDeliverySignature: (signature: DeliverySignature) => void;
  addCustomerRating: (rating: number, feedback: string) => void;
  verifyPickup: () => void;
  saveDelivery: () => Promise<void>;
  syncDelivery: () => Promise<void>;
  loadDeliveryHistory: () => Promise<void>;
  clearCurrentDelivery: () => void;
}

export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
  currentDelivery: null,
  deliveryHistory: [],
  isUploading: false,

  initializeDelivery: (trip_id: number) => {
    const delivery: DeliveryProof = {
      trip_id,
      pickup_verified: false,
      photos: [],
      checklist: getDefaultChecklist(),
      sync_status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    set({ currentDelivery: delivery });
  },

  addPhoto: (photo: DeliveryPhoto) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        photos: [...delivery.photos, photo],
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  removePhoto: (photoId: string) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        photos: delivery.photos.filter((p) => p.id !== photoId),
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  updateChecklistItem: (itemId: number, checked: boolean, notes?: string) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        checklist: delivery.checklist.map((item) =>
          item.id === itemId ? { ...item, checked, notes: notes || item.notes } : item
        ),
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  addChecklistPhoto: (itemId: number, photo: DeliveryPhoto) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        checklist: delivery.checklist.map((item) =>
          item.id === itemId ? { ...item, photo } : item
        ),
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  addPickupSignature: (signature: DeliverySignature) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        pickup_signature: signature,
        pickup_time: Date.now(),
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  addDeliverySignature: (signature: DeliverySignature) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        delivery_signature: signature,
        delivery_time: Date.now(),
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  addCustomerRating: (rating: number, feedback: string) => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        customer_rating: rating,
        customer_feedback: feedback,
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  verifyPickup: () => {
    const delivery = get().currentDelivery;
    if (delivery) {
      const updated = {
        ...delivery,
        pickup_verified: true,
        pickup_time: Date.now(),
        updated_at: Date.now(),
      };
      set({ currentDelivery: updated });
    }
  },

  saveDelivery: async () => {
    const delivery = get().currentDelivery;
    if (!delivery) return;

    try {
      const history = get().deliveryHistory;
      const updated = [...history, { ...delivery, sync_status: 'pending' as const }];
      set({ deliveryHistory: updated });

      // Save to AsyncStorage
      await AsyncStorage.setItem('deliveryHistory', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save delivery:', error);
    }
  },

  syncDelivery: async () => {
    const delivery = get().currentDelivery;
    if (!delivery) return;

    set({ isUploading: true });
    try {
      const updated = { ...delivery, sync_status: 'syncing' as const };
      set({ currentDelivery: updated });

      // Mock API call - in production would upload to backend
      // await uploadDeliveryProof(delivery);

      const finalDelivery = { ...updated, sync_status: 'synced' as const };

      const history = get().deliveryHistory;
      const historyIndex = history.findIndex((d) => d.trip_id === delivery.trip_id);
      if (historyIndex >= 0) {
        history[historyIndex] = finalDelivery;
      } else {
        history.push(finalDelivery);
      }

      set({ currentDelivery: finalDelivery, deliveryHistory: history });
      await AsyncStorage.setItem('deliveryHistory', JSON.stringify(history));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const failed = { ...delivery, sync_status: 'error' as const, sync_error: errorMsg };
      set({ currentDelivery: failed });
    } finally {
      set({ isUploading: false });
    }
  },

  loadDeliveryHistory: async () => {
    try {
      const historyJson = await AsyncStorage.getItem('deliveryHistory');
      if (historyJson) {
        set({ deliveryHistory: JSON.parse(historyJson) });
      }
    } catch (error) {
      console.error('Failed to load delivery history:', error);
    }
  },

  clearCurrentDelivery: () => {
    set({ currentDelivery: null });
  },
}));

const getDefaultChecklist = (): ChecklistItem[] => [
  { id: 1, label: 'Package condition verified', checked: false },
  { id: 2, label: 'Seals intact', checked: false },
  { id: 3, label: 'Weight matches manifest', checked: false },
  { id: 4, label: 'Recipient identity verified', checked: false },
  { id: 5, label: 'Special instructions followed', checked: false },
  { id: 6, label: 'No damage on delivery', checked: false },
  { id: 7, label: 'Recipient satisfied', checked: false },
  { id: 8, label: 'All documents signed', checked: false },
];
