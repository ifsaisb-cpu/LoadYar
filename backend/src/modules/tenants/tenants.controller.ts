import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';

@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post('signup')
  async signup(@Body() dto: any) {
    return this.tenantsService.signup(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getTenants(@Query('skip') skip = 0, @Query('take') take = 10) {
    return this.tenantsService.getTenants(skip, take);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getTenantById(@Param('id') id: number) {
    return this.tenantsService.getTenantById(id);
  }

  @Put(':id/suspend')
  @UseGuards(AuthGuard('jwt'))
  async suspendTenant(@Param('id') id: number) {
    return this.tenantsService.suspendTenant(id);
  }

  @Put(':id/reactivate')
  @UseGuards(AuthGuard('jwt'))
  async reactivateTenant(@Param('id') id: number) {
    return this.tenantsService.reactivateTenant(id);
  }
}
