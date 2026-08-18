import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingEvent, TenantSubscription } from '../../entities/tenant.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BillingEvent, TenantSubscription])],
  providers: [BillingService],
  controllers: [BillingController],
})
export class BillingModule {}
