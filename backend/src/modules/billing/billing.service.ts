import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingEvent, TenantSubscription } from '../../entities/tenant.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingEvent)
    private billingEventRepo: Repository<BillingEvent>,
    @InjectRepository(TenantSubscription)
    private subRepo: Repository<TenantSubscription>,
  ) {}

  async getInvoices(tenant_id: number, skip = 0, take = 10) {
    const [invoices, total] = await this.billingEventRepo.findAndCount({
      where: { tenant_id, event_type: 'invoice_generated' },
      skip,
      take,
      order: { created_at: 'DESC' },
    });
    return { invoices, total };
  }

  async recordPayment(tenant_id: number, amount: number, method: string) {
    const event = this.billingEventRepo.create({
      tenant_id,
      event_type: 'payment_received',
      description: `Payment via ${method}`,
      amount,
      created_by: 'system',
      updated_by: 'system',
    });
    return this.billingEventRepo.save(event);
  }

  async upgradePlan(tenant_id: number, new_plan: string) {
    const sub = await this.subRepo.findOne({ where: { tenant_id } });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    const planAmounts = { basic: 30000, pro: 50000, enterprise: 100000 };
    sub.plan = new_plan as any;
    sub.monthly_amount = planAmounts[new_plan] || 30000;
    sub.updated_by = 'system';

    await this.subRepo.save(sub);

    const event = this.billingEventRepo.create({
      tenant_id,
      event_type: 'plan_upgrade',
      description: `Upgraded to ${new_plan} plan`,
      created_by: 'system',
      updated_by: 'system',
    });
    await this.billingEventRepo.save(event);

    return { message: `Upgraded to ${new_plan} plan` };
  }

  async getBillingHistory(tenant_id: number, skip = 0, take = 20) {
    const [events, total] = await this.billingEventRepo.findAndCount({
      where: { tenant_id },
      skip,
      take,
      order: { created_at: 'DESC' },
    });
    return { events, total };
  }
}
