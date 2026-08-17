import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Roles('admin', 'dispatcher')
  async getCustomers(@Request() req: any) {
    return this.customerService.getCustomers(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  async getCustomerById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.customerService.getCustomerById(id, req.user.tenant_id);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(
    @Body() dto: CreateCustomerDto,
    @Request() req: any,
  ) {
    return this.customerService.createCustomer(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Patch(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
    @Request() req: any,
  ) {
    return this.customerService.updateCustomer(
      id,
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.customerService.deleteCustomer(id, req.user.tenant_id);
  }
}
