import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})
export class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userConnections = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    const tenantId = client.handshake.auth.tenantId;

    if (userId && tenantId) {
      const key = `${tenantId}-${userId}`;
      if (!this.userConnections.has(key)) {
        this.userConnections.set(key, new Set());
      }
      this.userConnections.get(key).add(client.id);

      client.join(`tenant-${tenantId}`);
      client.join(`user-${key}`);

      this.server.emit('user-connected', {
        userId,
        tenantId,
        timestamp: new Date(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    const tenantId = client.handshake.auth.tenantId;

    if (userId && tenantId) {
      const key = `${tenantId}-${userId}`;
      const connections = this.userConnections.get(key);
      if (connections) {
        connections.delete(client.id);
        if (connections.size === 0) {
          this.userConnections.delete(key);
        }
      }
    }
  }

  @SubscribeMessage('trip:update')
  handleTripUpdate(client: Socket, data: any) {
    const tenantId = client.handshake.auth.tenantId;
    const userId = client.handshake.auth.userId;

    const tripUpdate = {
      trip_id: data.trip_id,
      status: data.status,
      updated_by: userId,
      timestamp: new Date(),
      ...data,
    };

    this.server.to(`tenant-${tenantId}`).emit('trip:updated', tripUpdate);
  }

  @SubscribeMessage('trip:status-change')
  handleStatusChange(client: Socket, data: any) {
    const tenantId = client.handshake.auth.tenantId;
    const userId = client.handshake.auth.userId;

    const statusChange = {
      trip_id: data.trip_id,
      old_status: data.old_status,
      new_status: data.new_status,
      changed_by: userId,
      timestamp: new Date(),
      reason: data.reason || null,
    };

    this.server.to(`tenant-${tenantId}`).emit('trip:status-changed', statusChange);
  }

  @SubscribeMessage('location:update')
  handleLocationUpdate(client: Socket, data: any) {
    const tenantId = client.handshake.auth.tenantId;
    const userId = client.handshake.auth.userId;

    const locationUpdate = {
      driver_id: data.driver_id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || null,
      timestamp: new Date(),
    };

    this.server.to(`tenant-${tenantId}`).emit('location:updated', locationUpdate);
  }

  @SubscribeMessage('notification:send')
  handleNotification(client: Socket, data: any) {
    const tenantId = client.handshake.auth.tenantId;
    const userId = client.handshake.auth.userId;

    const notification = {
      type: data.type,
      message: data.message,
      sent_by: userId,
      target_user: data.target_user || null,
      timestamp: new Date(),
      data: data.data || {},
    };

    if (data.target_user) {
      const targetKey = `${tenantId}-${data.target_user}`;
      this.server.to(`user-${targetKey}`).emit('notification:received', notification);
    } else {
      this.server.to(`tenant-${tenantId}`).emit('notification:received', notification);
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, data: any) {
    const tenantId = client.handshake.auth.tenantId;
    const userId = client.handshake.auth.userId;

    this.server.to(`tenant-${tenantId}`).emit('typing:user-started', {
      user_id: userId,
      field: data.field,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('typing:end')
  handleTypingEnd(client: Socket, data: any) {
    const tenantId = client.handshake.auth.tenantId;
    const userId = client.handshake.auth.userId;

    this.server.to(`tenant-${tenantId}`).emit('typing:user-stopped', {
      user_id: userId,
      field: data.field,
      timestamp: new Date(),
    });
  }

  broadcastTripUpdate(tenantId: number, trip: any) {
    this.server.to(`tenant-${tenantId}`).emit('trip:broadcast-update', {
      ...trip,
      timestamp: new Date(),
    });
  }

  notifyUser(tenantId: number, userId: number, message: any) {
    const key = `${tenantId}-${userId}`;
    this.server.to(`user-${key}`).emit('notification:broadcast', {
      ...message,
      timestamp: new Date(),
    });
  }

  broadcastToTenant(tenantId: number, event: string, data: any) {
    this.server.to(`tenant-${tenantId}`).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }
}
