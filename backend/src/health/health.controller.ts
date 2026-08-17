import { Controller, Get, Logger } from '@nestjs/common';
import { HealthCheck, HealthCheckService, DatabaseHealthIndicator } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    this.logger.debug('Health check initiated');

    try {
      return await this.health.check([
        () => this.db.pingCheck('database', { timeout: 300 }),
      ]);
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw error;
    }
  }

  @Get('/readiness')
  @Public()
  async readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('/liveness')
  @Public()
  async liveness() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/metrics')
  @Public()
  async metrics() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return {
      uptime_seconds: Math.round(uptime),
      memory: {
        rss_mb: Math.round(memory.rss / 1024 / 1024),
        heapTotal_mb: Math.round(memory.heapTotal / 1024 / 1024),
        heapUsed_mb: Math.round(memory.heapUsed / 1024 / 1024),
        external_mb: Math.round(memory.external / 1024 / 1024),
      },
      cpu: {
        user_percent: 0, // Would need native module for accurate CPU %
        system_percent: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
