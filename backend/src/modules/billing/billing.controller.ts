import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';

@Controller('api/v1/billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('tenant/:tenant_id/invoices')
  async getInvoices(@Param('tenant_id') tenant_id: number, @Query('skip') skip = 0, @Query('take') take = 10) {
    return this.billingService.getInvoices(tenant_id, skip, take);
  }

  @Post('tenant/:tenant_id/payment')
  async recordPayment(@Param('tenant_id') tenant_id: number, @Body() dto: { amount: number; method: string }) {
    return this.billingService.recordPayment(tenant_id, dto.amount, dto.method);
  }

  @Put('tenant/:tenant_id/upgrade')
  async upgradePlan(@Param('tenant_id') tenant_id: number, @Body() dto: { plan: string }) {
    return this.billingService.upgradePlan(tenant_id, dto.plan);
  }

  @Get('tenant/:tenant_id/history')
  async getBillingHistory(@Param('tenant_id') tenant_id: number, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.billingService.getBillingHistory(tenant_id, skip, take);
  }
}
