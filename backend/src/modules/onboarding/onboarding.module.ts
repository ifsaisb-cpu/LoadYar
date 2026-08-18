import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingProgress, Tenant } from '../../entities/tenant.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingProgress, Tenant])],
  providers: [OnboardingService],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
