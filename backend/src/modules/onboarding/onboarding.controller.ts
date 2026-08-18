import { Controller, Post, Put, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';

@Controller('api/v1/onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post(':tenant_id/initialize')
  async initialize(@Param('tenant_id') tenant_id: number) {
    return this.onboardingService.initializeOnboarding(tenant_id);
  }

  @Put(':tenant_id/step/:step')
  async updateStep(@Param('tenant_id') tenant_id: number, @Param('step') step: number, @Body() data: any) {
    return this.onboardingService.updateStep(tenant_id, step, data);
  }

  @Post(':tenant_id/complete')
  async complete(@Param('tenant_id') tenant_id: number) {
    return this.onboardingService.completeOnboarding(tenant_id);
  }

  @Get(':tenant_id/progress')
  async getProgress(@Param('tenant_id') tenant_id: number) {
    return this.onboardingService.getProgress(tenant_id);
  }
}
