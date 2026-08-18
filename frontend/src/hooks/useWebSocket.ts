import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  isConnected: boolean;
  socket: Socket | null;
  subscribe: (event: string, callback: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
}

export const useWebSocket = (tenantId: number): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`http://${window.location.hostname}:3001`, {
      query: {
        tenant_id: tenantId,
        user_id: 1, // Would come from auth context in real app
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Subscribe to analytics events
      socket.emit('analytics:subscribe-dashboard', { tenant_id: tenantId });
      socket.emit('analytics:subscribe-trips', { tenant_id: tenantId });
      socket.emit('analytics:subscribe-drivers', { tenant_id: tenantId });
      socket.emit('analytics:subscribe-revenue', { tenant_id: tenantId });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [tenantId]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    subscribe,
    emit,
  };
};
