import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingProgress, Tenant } from '../../entities/tenant.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingProgress)
    private progressRepo: Repository<OnboardingProgress>,
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
  ) {}

  async initializeOnboarding(tenant_id: number) {
    const existing = await this.progressRepo.findOne({ where: { tenant_id } });
    if (existing) return existing;

    const progress = this.progressRepo.create({
      tenant_id,
      current_step: 1,
      completed_steps: [false, false, false, false, false, false],
      step_data: {},
      is_completed: false,
      created_by: 'system',
      updated_by: 'system',
    });
    return this.progressRepo.save(progress);
  }

  async updateStep(tenant_id: number, step: number, data: any) {
    const progress = await this.progressRepo.findOne({ where: { tenant_id } });
    if (!progress) {
      throw new NotFoundException('Onboarding not found');
    }

    progress.step_data = { ...progress.step_data, [`step_${step}`]: data };
    progress.completed_steps[step - 1] = true;
    progress.current_step = step;
    progress.updated_by = 'system';

    return this.progressRepo.save(progress);
  }

  async completeOnboarding(tenant_id: number) {
    const progress = await this.progressRepo.findOne({ where: { tenant_id } });
    if (!progress) {
      throw new NotFoundException('Onboarding not found');
    }

    progress.is_completed = true;
    progress.current_step = 6;
    progress.updated_by = 'system';
    await this.progressRepo.save(progress);

    const tenant = await this.tenantRepo.findOne({ where: { id: tenant_id } });
    if (tenant) {
      tenant.subscription_status = 'active';
      tenant.updated_by = 'system';
      await this.tenantRepo.save(tenant);
    }

    return { message: 'Onboarding completed', tenant_id };
  }

  async getProgress(tenant_id: number) {
    const progress = await this.progressRepo.findOne({ where: { tenant_id } });
    if (!progress) {
      throw new NotFoundException('Onboarding not found');
    }
    return progress;
  }
}
