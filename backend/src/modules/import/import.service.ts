import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportJob } from '../../entities/tenant.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportJob)
    private importRepo: Repository<ImportJob>,
  ) {}

  async uploadFile(tenant_id: number, file: any, entity_type: string) {
    const job = this.importRepo.create({
      tenant_id,
      file_name: file.originalname,
      entity_type,
      status: 'pending',
      created_by: 'system',
      updated_by: 'system',
    });
    return this.importRepo.save(job);
  }

  async executeImport(job_id: number) {
    const job = await this.importRepo.findOne({ where: { id: job_id } });
    if (!job) return null;

    job.status = 'completed';
    job.success_count = 100;
    job.error_count = 0;
    job.updated_by = 'system';

    return this.importRepo.save(job);
  }

  async getJobDetails(job_id: number) {
    return this.importRepo.findOne({ where: { id: job_id } });
  }

  async getJobHistory(tenant_id: number, skip = 0, take = 10) {
    return this.importRepo.findAndCount({
      where: { tenant_id },
      skip,
      take,
    });
  }
}
