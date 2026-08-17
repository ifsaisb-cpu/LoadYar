import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GLAccountService } from './gl-account.service';
import { CreateGLAccountDto } from './gl-account.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('gl-accounts')
@UseGuards(JwtAuthGuard)
export class GLAccountController {
  constructor(private readonly glAccountService: GLAccountService) {}

  @Get()
  @Roles('admin', 'dispatcher')
  async getAccounts(@Request() req: any) {
    return this.glAccountService.getAccounts(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  async getAccountById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.glAccountService.getAccountById(id, req.user.tenant_id);
  }

  @Get('code/:code')
  @Roles('admin', 'dispatcher')
  async getAccountByCode(
    @Param('code') code: string,
    @Request() req: any,
  ) {
    return this.glAccountService.getAccountByCode(code, req.user.tenant_id);
  }

  @Get(':id/balance')
  @Roles('admin', 'dispatcher')
  async getAccountBalance(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.glAccountService.getAccountBalance(id, req.user.tenant_id);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(
    @Body() dto: CreateGLAccountDto,
    @Request() req: any,
  ) {
    return this.glAccountService.createAccount(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }
}
