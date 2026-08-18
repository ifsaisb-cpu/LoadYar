import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AnalyticsService } from './analytics.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private analyticsService: AnalyticsService) {}

  handleConnection(client: Socket) {
    const tenant_id = client.handshake.query.tenant_id as string;
    const user_id = client.handshake.query.user_id as string;

    if (tenant_id && user_id) {
      client.join(`analytics-tenant-${tenant_id}`);
      client.join(`analytics-user-${user_id}`);
      console.log(`User ${user_id} connected to analytics for tenant ${tenant_id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to live dashboard updates
  @SubscribeMessage('analytics:subscribe-dashboard')
  async handleSubscribeDashboard(client: Socket, data: { tenant_id: number }) {
    const kpis = await this.analyticsService.getDashboardKPIs(data.tenant_id);
    client.emit('analytics:dashboard-update', kpis);
  }

  // Subscribe to trip metrics updates
  @SubscribeMessage('analytics:subscribe-trips')
  async handleSubscribeTrips(client: Socket, data: { tenant_id: number }) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const metrics = await this.analyticsService.getTripAnalytics(
      data.tenant_id,
      startDate,
      endDate,
    );
    client.emit('analytics:trips-update', metrics);
  }

  // Subscribe to driver performance updates
  @SubscribeMessage('analytics:subscribe-drivers')
  async handleSubscribeDrivers(client: Socket, data: { tenant_id: number }) {
    const drivers = await this.analyticsService.getDriverPerformance(data.tenant_id, 10);
    client.emit('analytics:drivers-update', drivers);
  }

  // Subscribe to revenue updates
  @SubscribeMessage('analytics:subscribe-revenue')
  async handleSubscribeRevenue(
    client: Socket,
    data: { tenant_id: number; period_type?: 'daily' | 'weekly' | 'monthly' },
  ) {
    const revenue = await this.analyticsService.getRevenueAnalytics(
      data.tenant_id,
      data.period_type || 'daily',
      30,
    );
    client.emit('analytics:revenue-update', revenue);
  }

  // Broadcast live metrics to all dashboard users
  broadcastDashboardUpdate(tenant_id: number, kpis: any): void {
    this.server.to(`analytics-tenant-${tenant_id}`).emit('analytics:dashboard-update', kpis);
  }

  // Broadcast trip update
  broadcastTripMetrics(tenant_id: number, metrics: any): void {
    this.server.to(`analytics-tenant-${tenant_id}`).emit('analytics:trips-update', metrics);
  }

  // Broadcast driver performance update
  broadcastDriverPerformance(tenant_id: number, drivers: any[]): void {
    this.server
      .to(`analytics-tenant-${tenant_id}`)
      .emit('analytics:drivers-update', drivers);
  }

  // Broadcast revenue update
  broadcastRevenueUpdate(tenant_id: number, revenue: any[]): void {
    this.server.to(`analytics-tenant-${tenant_id}`).emit('analytics:revenue-update', revenue);
  }

  // Broadcast real-time KPI changes
  broadcastKPIChange(tenant_id: number, metric: string, value: number): void {
    this.server.to(`analytics-tenant-${tenant_id}`).emit('analytics:kpi-change', {
      metric,
      value,
      timestamp: new Date(),
    });
  }
}
