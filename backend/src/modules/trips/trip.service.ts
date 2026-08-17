import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { Customer } from '../../entities/customer.entity';

export class CreateTripDto {
  bilty_no: string;
  booking_id?: number;
  entry_mode?: string; // digital, manual_logged
  date: Date;
  customer_id: number;
  route?: string;
  consigner?: string;
  consignee: string;
  consignee_address?: string;
  carrier_id?: number;
  driver_id?: number;
  booking_time?: string;
  return_load_type?: string;
  freight_paisa?: number;
  open_market?: boolean;
  rate_agreement_id?: number;
  rate_overridden?: boolean;
  media_ref?: string;
  veh_make?: string;
  veh_type?: string;
  veh_chassis?: string;
  veh_engine?: string;
  veh_colour?: string;
  veh_model?: string;
  veh_reg?: string;
  veh_condition?: string;
  agent_id?: number;
  agent_cost_paisa?: number;
  notes?: string;
  load_from?: string;
  load_to?: string;
}

export class UpdateTripDto {
  status?: string; // booked, in_transit, delivered, closed
  freight_paisa?: number;
  rate_overridden?: boolean;
  carrier_id?: number;
  driver_id?: number;
  consignee_address?: string;
  notes?: string;
  veh_condition?: string;
  veh_make?: string;
  veh_model?: string;
  veh_chassis?: string;
  veh_engine?: string;
  veh_colour?: string;
  veh_reg?: string;
  veh_type?: string;
  pay_status?: string;
}

export class TripResponseDto {
  id: number;
  bilty_no: string;
  customer_id: number;
  date: Date;
  status: string;
  freight_paisa?: number;
  consignee: string;
  carrier_id?: number;
  driver_id?: number;
  vehicle_details?: {
    make?: string;
    model?: string;
    chassis?: string;
    engine?: string;
    color?: string;
    reg?: string;
    type?: string;
  };
  route?: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async createTrip(
    dto: CreateTripDto,
    tenantId: number,
    createdBy: string,
  ): Promise<TripResponseDto> {
    // Validate customer exists
    const customer = await this.customersRepository.findOne({
      where: {
        id: dto.customer_id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate bilty_no uniqueness
    if (dto.bilty_no) {
      const existing = await this.tripsRepository.findOne({
        where: {
          tenant_id: tenantId,
          bilty_no: dto.bilty_no,
          deleted_at: IsNull(),
        },
      });

      if (existing) {
        throw new ConflictException('Bilty number already exists');
      }
    }

    // Validate trip date
    const tripDate = new Date(dto.date);
    if (tripDate > new Date()) {
      // Allow future dates for advance bookings
    }

    // Create trip
    const trip = new Trip();
    trip.tenant_id = tenantId;
    trip.bilty_no = dto.bilty_no;
    trip.booking_id = dto.booking_id || null;
    trip.entry_mode = dto.entry_mode || 'manual_logged';
    trip.date = tripDate;
    trip.customer_id = dto.customer_id;
    trip.route = dto.route || null;
    trip.consigner = dto.consigner || null;
    trip.consignee = dto.consignee;
    trip.consignee_address = dto.consignee_address || null;
    trip.carrier_id = dto.carrier_id || null;
    trip.driver_id = dto.driver_id || null;
    trip.booking_time = dto.booking_time || null;
    trip.return_load_type = dto.return_load_type || null;
    trip.status = 'booked';
    trip.freight_paisa = dto.freight_paisa || null;
    trip.open_market = dto.open_market || false;
    trip.rate_agreement_id = dto.rate_agreement_id || null;
    trip.rate_overridden = dto.rate_overridden || false;
    trip.media_ref = dto.media_ref || null;
    trip.veh_make = dto.veh_make || null;
    trip.veh_type = dto.veh_type || null;
    trip.veh_chassis = dto.veh_chassis || null;
    trip.veh_engine = dto.veh_engine || null;
    trip.veh_colour = dto.veh_colour || null;
    trip.veh_model = dto.veh_model || null;
    trip.veh_reg = dto.veh_reg || null;
    trip.veh_condition = dto.veh_condition || null;
    trip.agent_id = dto.agent_id || null;
    trip.agent_cost_paisa = dto.agent_cost_paisa || null;
    trip.notes = dto.notes || null;
    trip.load_from = dto.load_from || null;
    trip.load_to = dto.load_to || null;
    trip.pay_status = 'to_be_billed';
    trip.created_by = createdBy;
    trip.updated_by = createdBy;

    const savedTrip = await this.tripsRepository.save(trip);
    return this.toResponseDto(savedTrip);
  }

  async getTrips(tenantId: number): Promise<TripResponseDto[]> {
    const trips = await this.tripsRepository.find({
      where: {
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return trips.map((t) => this.toResponseDto(t));
  }

  async getTripById(id: number, tenantId: number): Promise<TripResponseDto> {
    const trip = await this.tripsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return this.toResponseDto(trip);
  }

  async updateTrip(
    id: number,
    dto: UpdateTripDto,
    tenantId: number,
    updatedBy: string,
  ): Promise<TripResponseDto> {
    const trip = await this.tripsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Validate status if changing
    if (dto.status) {
      const validStatuses = ['booked', 'in_transit', 'delivered', 'closed'];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException(
          'Invalid status. Must be: booked, in_transit, delivered, or closed',
        );
      }
      trip.status = dto.status;
    }

    // Validate pay_status if changing
    if (dto.pay_status) {
      const validPayStatuses = ['to_be_billed', 'to_pay', 'partial', 'paid'];
      if (!validPayStatuses.includes(dto.pay_status)) {
        throw new BadRequestException('Invalid pay_status');
      }
      trip.pay_status = dto.pay_status;
    }

    // Update fields
    if (dto.freight_paisa !== undefined) trip.freight_paisa = dto.freight_paisa;
    if (dto.rate_overridden !== undefined) trip.rate_overridden = dto.rate_overridden;
    if (dto.carrier_id !== undefined) trip.carrier_id = dto.carrier_id;
    if (dto.driver_id !== undefined) trip.driver_id = dto.driver_id;
    if (dto.consignee_address !== undefined) trip.consignee_address = dto.consignee_address;
    if (dto.notes !== undefined) trip.notes = dto.notes;
    if (dto.veh_condition !== undefined) trip.veh_condition = dto.veh_condition;
    if (dto.veh_make !== undefined) trip.veh_make = dto.veh_make;
    if (dto.veh_model !== undefined) trip.veh_model = dto.veh_model;
    if (dto.veh_chassis !== undefined) trip.veh_chassis = dto.veh_chassis;
    if (dto.veh_engine !== undefined) trip.veh_engine = dto.veh_engine;
    if (dto.veh_colour !== undefined) trip.veh_colour = dto.veh_colour;
    if (dto.veh_reg !== undefined) trip.veh_reg = dto.veh_reg;
    if (dto.veh_type !== undefined) trip.veh_type = dto.veh_type;

    trip.updated_by = updatedBy;
    trip.updated_at = new Date();

    const savedTrip = await this.tripsRepository.save(trip);
    return this.toResponseDto(savedTrip);
  }

  async getTripsByCustomer(
    customerId: number,
    tenantId: number,
  ): Promise<TripResponseDto[]> {
    const trips = await this.tripsRepository.find({
      where: {
        customer_id: customerId,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return trips.map((t) => this.toResponseDto(t));
  }

  async getTripsByStatus(
    status: string,
    tenantId: number,
  ): Promise<TripResponseDto[]> {
    const validStatuses = ['booked', 'in_transit', 'delivered', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const trips = await this.tripsRepository.find({
      where: {
        status,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return trips.map((t) => this.toResponseDto(t));
  }

  private toResponseDto(trip: Trip): TripResponseDto {
    return {
      id: trip.id,
      bilty_no: trip.bilty_no,
      customer_id: trip.customer_id,
      date: trip.date,
      status: trip.status,
      freight_paisa: trip.freight_paisa,
      consignee: trip.consignee,
      carrier_id: trip.carrier_id,
      driver_id: trip.driver_id,
      vehicle_details: {
        make: trip.veh_make,
        model: trip.veh_model,
        chassis: trip.veh_chassis,
        engine: trip.veh_engine,
        color: trip.veh_colour,
        reg: trip.veh_reg,
        type: trip.veh_type,
      },
      route: trip.route,
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    };
  }
}
