import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip])],
  providers: [],
  controllers: [],
  exports: [],
})
export class TripsModule {}
