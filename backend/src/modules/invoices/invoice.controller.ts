import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @Roles('admin', 'dispatcher')
  async getInvoices(@Request() req: any) {
    return this.invoiceService.getInvoices(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  async getInvoiceById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.invoiceService.getInvoiceById(id, req.user.tenant_id);
  }

  @Get('customer/:customerId')
  @Roles('admin', 'dispatcher')
  async getInvoicesByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Request() req: any,
  ) {
    return this.invoiceService.getInvoicesByCustomer(customerId, req.user.tenant_id);
  }

  @Get('status/:status')
  @Roles('admin', 'dispatcher')
  async getInvoicesByStatus(
    @Param('status') status: string,
    @Request() req: any,
  ) {
    return this.invoiceService.getInvoicesByStatus(status, req.user.tenant_id);
  }

  @Get('trip/:tripId')
  @Roles('admin', 'dispatcher')
  async getInvoicesByTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Request() req: any,
  ) {
    return this.invoiceService.getInvoicesByTrip(tripId, req.user.tenant_id);
  }

  @Post()
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @Request() req: any,
  ) {
    return this.invoiceService.createInvoice(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  async updateInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceDto,
    @Request() req: any,
  ) {
    return this.invoiceService.updateInvoice(
      id,
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }
}
