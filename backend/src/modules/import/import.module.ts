import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportJob } from '../../entities/tenant.entity';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ImportJob])],
  providers: [ImportService],
  controllers: [ImportController],
})
export class ImportModule {}
