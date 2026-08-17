import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto, UpdateTripDto } from './trip.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  @Roles('admin', 'dispatcher')
  async getTrips(@Request() req: any) {
    return this.tripService.getTrips(req.user.tenant_id);
  }

  @Get(':id')
  @Roles('admin', 'dispatcher')
  async getTripById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.tripService.getTripById(id, req.user.tenant_id);
  }

  @Get('customer/:customerId')
  @Roles('admin', 'dispatcher')
  async getTripsByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Request() req: any,
  ) {
    return this.tripService.getTripsByCustomer(customerId, req.user.tenant_id);
  }

  @Get('status/:status')
  @Roles('admin', 'dispatcher')
  async getTripsByStatus(
    @Param('status') status: string,
    @Request() req: any,
  ) {
    return this.tripService.getTripsByStatus(status, req.user.tenant_id);
  }

  @Post()
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  async createTrip(
    @Body() dto: CreateTripDto,
    @Request() req: any,
  ) {
    return this.tripService.createTrip(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Patch(':id')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.OK)
  async updateTrip(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTripDto,
    @Request() req: any,
  ) {
    return this.tripService.updateTrip(
      id,
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }
}
