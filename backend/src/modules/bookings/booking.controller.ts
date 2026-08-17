import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingDto } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @Roles('admin', 'dispatcher')
  async getBookings(@Request() req: any) {
    return this.bookingService.getBookings(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  async getBookingById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.bookingService.getBookingById(id, req.user.tenant_id);
  }

  @Get('customer/:customerId')
  @Roles('admin', 'dispatcher')
  async getBookingsByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Request() req: any,
  ) {
    return this.bookingService.getBookingsByCustomer(customerId, req.user.tenant_id);
  }

  @Post()
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @Body() dto: CreateBookingDto,
    @Request() req: any,
  ) {
    return this.bookingService.createBooking(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  async updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
    @Request() req: any,
  ) {
    return this.bookingService.updateBooking(
      id,
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Delete(':id')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  async deleteBooking(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.bookingService.deleteBooking(id, req.user.tenant_id);
  }
}
