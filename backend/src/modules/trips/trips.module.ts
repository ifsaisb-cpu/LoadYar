import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Customer } from '../../entities/customer.entity';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Customer])],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripsModule {}
