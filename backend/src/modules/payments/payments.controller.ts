import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('process')
  async processPayment(@Body() dto: any) {
    return this.paymentsService.processPayment(dto.tenant_id, dto.user_id, {
      amount: dto.amount,
      currency: dto.currency || 'PKR',
      method: dto.method,
      payment_method_id: dto.payment_method_id,
      metadata: dto.metadata,
    });
  }

  @Post('method/save')
  async savePaymentMethod(@Body() dto: any) {
    return this.paymentsService.savePaymentMethod(dto.tenant_id, dto.user_id, {
      method_type: dto.method_type,
      provider: dto.provider,
      last_four_digits: dto.last_four_digits,
      card_holder_name: dto.card_holder_name,
      token: dto.token,
      is_default: dto.is_default,
    });
  }

  @Get('methods/:user_id')
  async getPaymentMethods(
    @Param('user_id') userId: number,
    @Query('tenant_id') tenantId: number,
  ) {
    return this.paymentsService.getPaymentMethods(tenantId, userId);
  }

  @Post('invoice/:invoice_id/pay')
  async recordInvoicePayment(
    @Param('invoice_id') invoiceId: number,
    @Body() dto: any,
  ) {
    return this.paymentsService.recordInvoicePayment(
      dto.tenant_id,
      invoiceId,
      dto.amount_paid,
      dto.payment_id,
    );
  }

  @Post('subscription/:subscription_id/setup-billing')
  async setupSubscriptionBilling(
    @Param('subscription_id') subscriptionId: number,
    @Body() dto: any,
  ) {
    return this.paymentsService.setupSubscriptionBilling(
      dto.tenant_id,
      subscriptionId,
      dto.billing_amount,
    );
  }

  @Post(':payment_id/retry')
  async retryFailedPayment(
    @Param('payment_id') paymentId: number,
    @Query('tenant_id') tenantId: number,
  ) {
    return this.paymentsService.retryFailedPayment(tenantId, paymentId);
  }

  @Get('history/:user_id')
  async getPaymentHistory(
    @Param('user_id') userId: number,
    @Query('tenant_id') tenantId: number,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.paymentsService.getPaymentHistory(tenantId, userId, skip, take);
  }

  @Post('reconciliation/:provider')
  async generateReconciliation(
    @Param('provider') provider: string,
    @Query('tenant_id') tenantId: number,
  ) {
    return this.paymentsService.generatePaymentReconciliation(tenantId, provider);
  }

  @Post(':payment_id/refund')
  async refundPayment(
    @Param('payment_id') paymentId: number,
    @Body() dto: any,
  ) {
    return this.paymentsService.refundPayment(
      dto.tenant_id,
      paymentId,
      dto.refund_amount,
    );
  }

  @Get('metrics')
  async getPaymentMetrics(@Query('tenant_id') tenantId: number) {
    return this.paymentsService.getPaymentMetrics(tenantId);
  }
}
