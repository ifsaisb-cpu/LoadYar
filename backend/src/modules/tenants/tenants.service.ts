import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant, User, TenantSubscription } from '../../entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(TenantSubscription)
    private subRepo: Repository<TenantSubscription>,
  ) {}

  async signup(dto: {
    company_name: string;
    admin_email: string;
    admin_password: string;
    country: string;
    timezone: string;
  }) {
    const now = new Date();
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    try {
      const tenant = this.tenantRepo.create({
        name: dto.company_name,
        country: dto.country,
        timezone: dto.timezone,
        subscription_status: 'trial',
        trial_ends_at: trialEnds,
        created_at: now,
        updated_at: now,
        created_by: 'system',
        updated_by: 'system',
      });
      const savedTenant = await this.tenantRepo.save(tenant);

      const passwordHash = await bcrypt.hash(dto.admin_password, 10);
      const user = this.userRepo.create({
        tenant_id: savedTenant.id,
        email: dto.admin_email,
        password_hash: passwordHash,
        full_name: dto.admin_email.split('@')[0],
        role: 'admin',
        is_active: true,
        created_at: now,
        updated_at: now,
        created_by: 'system',
        updated_by: 'system',
      });
      await this.userRepo.save(user);

      const subscription = this.subRepo.create({
        tenant_id: savedTenant.id,
        plan: 'basic',
        monthly_amount: 30000,
        billing_date: now,
        created_at: now,
        updated_at: now,
        created_by: 'system',
        updated_by: 'system',
      });
      await this.subRepo.save(subscription);

      return {
        tenant_id: savedTenant.id,
        message: 'Signup successful. Trial period: 14 days',
        trial_ends_at: trialEnds,
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async getTenants(skip = 0, take = 10) {
    const [tenants, total] = await this.tenantRepo.findAndCount({
      skip,
      take,
      relations: ['subscriptions'],
    });
    return { tenants, total };
  }

  async getTenantById(id: number) {
    const tenant = await this.tenantRepo.findOne({
      where: { id },
      relations: ['subscriptions', 'users'],
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async suspendTenant(id: number) {
    await this.tenantRepo.update(id, {
      subscription_status: 'suspended',
      updated_by: 'system',
    });
    return { message: 'Tenant suspended' };
  }

  async reactivateTenant(id: number) {
    await this.tenantRepo.update(id, {
      subscription_status: 'active',
      updated_by: 'system',
    });
    return { message: 'Tenant reactivated' };
  }
}
