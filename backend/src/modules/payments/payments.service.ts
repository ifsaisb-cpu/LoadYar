import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

interface PaymentRequest {
  amount: number;
  currency: string;
  method: 'stripe' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
  payment_method_id?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  private payments: any[] = [];
  private paymentMethods = new Map<string, any>();
  private invoicePaid: any[] = [];

  constructor(private notificationsService: NotificationsService) {
    this.initializeSampleMethods();
  }

  private initializeSampleMethods() {
    this.paymentMethods.set('1-1', [
      {
        id: 1,
        method_type: 'card',
        provider: 'stripe',
        last_four_digits: '4242',
        card_holder_name: 'Ahmed Khan',
        is_default: true,
        token: 'pm_stripe_4242_****',
      },
      {
        id: 2,
        method_type: 'mobile_money',
        provider: 'jazzcash',
        last_four_digits: '3021',
        is_default: false,
        token: 'pm_jazzcash_3021_****',
      },
    ]);
  }

  async processPayment(tenantId: number, userId: number, paymentRequest: PaymentRequest) {
    const paymentId = Math.floor(Math.random() * 100000);
    const transactionId = this.generateTransactionId(paymentRequest.method);

    const payment = {
      id: paymentId,
      tenant_id: tenantId,
      user_id: userId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      method: paymentRequest.method,
      status: 'processing',
      transaction_id: transactionId,
      reference_number: `REF-${Date.now()}`,
      payment_details: {
        method: paymentRequest.method,
        amount: paymentRequest.amount,
        timestamp: new Date(),
      },
      created_at: new Date(),
      updated_at: new Date(),
      retry_count: 0,
    };

    this.payments.push(payment);

    return this.simulatePaymentProcessing(tenantId, userId, payment, paymentRequest.method);
  }

  private async simulatePaymentProcessing(tenantId: number, userId: number, payment: any, method: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        payment.status = 'completed';
        payment.completed_at = new Date();
        payment.updated_at = new Date();

        this.notificationsService.sendPaymentNotification(tenantId, userId, {
          payment_id: payment.id,
          amount: payment.amount,
          method: method,
        });

        resolve({
          success: true,
          payment_id: payment.id,
          transaction_id: payment.transaction_id,
          reference_number: payment.reference_number,
          amount: payment.amount,
          status: 'completed',
          timestamp: new Date(),
        });
      }, 1000);
    });
  }

  private generateTransactionId(method: string): string {
    const prefixes = {
      stripe: 'ch_',
      jazzcash: 'jc_',
      easypaisa: 'ep_',
      bank_transfer: 'bt_',
    };
    return prefixes[method] + Math.random().toString(36).substring(2, 15);
  }

  async savePaymentMethod(tenantId: number, userId: number, methodData: any) {
    const key = `${tenantId}-${userId}`;
    if (!this.paymentMethods.has(key)) {
      this.paymentMethods.set(key, []);
    }

    const method = {
      id: Math.floor(Math.random() * 10000),
      method_type: methodData.method_type,
      provider: methodData.provider,
      last_four_digits: methodData.last_four_digits,
      card_holder_name: methodData.card_holder_name,
      is_default: methodData.is_default || false,
      is_active: true,
      token: this.maskSensitiveData(methodData.token),
      created_at: new Date(),
    };

    this.paymentMethods.get(key).push(method);

    return {
      success: true,
      payment_method_id: method.id,
      masked_token: method.token,
    };
  }

  private maskSensitiveData(data: string): string {
    return data.substring(0, 4) + '****' + data.substring(data.length - 4);
  }

  getPaymentMethods(tenantId: number, userId: number) {
    const key = `${tenantId}-${userId}`;
    return this.paymentMethods.get(key) || [];
  }

  async recordInvoicePayment(tenantId: number, invoiceId: number, amountPaid: number, paymentId: number) {
    const invoicePayment = {
      id: Math.floor(Math.random() * 10000),
      tenant_id: tenantId,
      invoice_id: invoiceId,
      amount_paid: amountPaid,
      payment_id: paymentId,
      paid_on: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.invoicePaid.push(invoicePayment);
    return { success: true, invoice_payment_id: invoicePayment.id };
  }

  async setupSubscriptionBilling(tenantId: number, subscriptionId: number, billingAmount: number) {
    return {
      success: true,
      subscription_id: subscriptionId,
      monthly_amount: billingAmount,
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      auto_renewal_enabled: true,
      message: 'Subscription billing configured. Will auto-renew on monthly anniversary.',
    };
  }

  async retryFailedPayment(tenantId: number, paymentId: number) {
    const payment = this.payments.find((p) => p.id === paymentId && p.tenant_id === tenantId);

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.retry_count >= 3) {
      return { success: false, message: 'Maximum retry attempts exceeded' };
    }

    payment.retry_count += 1;
    payment.status = 'processing';
    payment.updated_at = new Date();

    return {
      success: true,
      payment_id: paymentId,
      retry_count: payment.retry_count,
      message: `Retry attempt ${payment.retry_count} of 3`,
    };
  }

  getPaymentHistory(tenantId: number, userId: number, skip = 0, take = 20) {
    const userPayments = this.payments
      .filter((p) => p.tenant_id === tenantId && p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      payments: userPayments.slice(skip, skip + take),
      total: userPayments.length,
    };
  }

  async generatePaymentReconciliation(tenantId: number, provider: string) {
    const providerPayments = this.payments.filter(
      (p) => p.tenant_id === tenantId && p.method === provider && p.status === 'completed',
    );

    const totalAmount = providerPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      reconciliation_id: Math.floor(Math.random() * 10000),
      provider: provider,
      total_transactions: providerPayments.length,
      total_amount: totalAmount,
      status: 'reconciled',
      reconciliation_date: new Date(),
      discrepancies: [],
    };
  }

  async refundPayment(tenantId: number, paymentId: number, refundAmount?: number) {
    const payment = this.payments.find((p) => p.id === paymentId && p.tenant_id === tenantId);

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.status !== 'completed') {
      return { success: false, message: 'Only completed payments can be refunded' };
    }

    const amountToRefund = refundAmount || payment.amount;

    payment.status = 'refunded';
    payment.updated_at = new Date();

    return {
      success: true,
      payment_id: paymentId,
      refund_amount: amountToRefund,
      refund_id: `ref_${Math.random().toString(36).substring(7)}`,
      original_amount: payment.amount,
      message: 'Refund processed successfully',
    };
  }

  getPaymentMetrics(tenantId: number) {
    const tenantPayments = this.payments.filter(
      (p) => p.tenant_id === tenantId && p.status === 'completed',
    );

    const totalRevenue = tenantPayments.reduce((sum, p) => sum + p.amount, 0);
    const successRate = tenantPayments.length > 0 ? 100 : 0;

    const methodBreakdown = {};
    tenantPayments.forEach((p) => {
      methodBreakdown[p.method] = (methodBreakdown[p.method] || 0) + p.amount;
    });

    return {
      total_revenue: totalRevenue,
      total_transactions: tenantPayments.length,
      success_rate: successRate,
      method_breakdown: methodBreakdown,
      timestamp: new Date(),
    };
  }
}
