import { Module } from '@nestjs/common';
import { TripsGateway } from './trips.gateway';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
  providers: [TripsGateway, TripsService],
  controllers: [TripsController],
  exports: [TripsService, TripsGateway],
})
export class TripsModule {}
