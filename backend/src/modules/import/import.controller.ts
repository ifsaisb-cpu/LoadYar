import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImportService } from './import.service';

@Controller('api/v1/import')
@UseGuards(AuthGuard('jwt'))
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('upload')
  async upload(@Body() dto: any) {
    return this.importService.uploadFile(dto.tenant_id, dto.file, dto.entity_type);
  }

  @Post(':job_id/execute')
  async execute(@Param('job_id') job_id: number) {
    return this.importService.executeImport(job_id);
  }

  @Get(':job_id')
  async getJobDetails(@Param('job_id') job_id: number) {
    return this.importService.getJobDetails(job_id);
  }

  @Get('tenant/:tenant_id/history')
  async getHistory(@Param('tenant_id') tenant_id: number, @Query('skip') skip = 0, @Query('take') take = 10) {
    return this.importService.getJobHistory(tenant_id, skip, take);
  }
}
