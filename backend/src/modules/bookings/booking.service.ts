import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { Customer } from '../../entities/customer.entity';

export class CreateBookingDto {
  customer_id: number;
  booking_date: Date;
  bilty_no?: string;
  gate_pass?: string;
  route_from?: string;
  destination?: string;
  consignee?: string;
  requested_pickup?: Date;
}

export class UpdateBookingDto {
  customer_id?: number;
  billing_date?: Date;
  bilty_no?: string;
  gate_pass?: string;
  route_from?: string;
  destination?: string;
  consignee?: string;
  requested_pickup?: Date;
  status?: string; // open, converted, booked
}

export class BookingResponseDto {
  id: number;
  customer_id: number;
  booking_date: Date;
  bilty_no?: string;
  gate_pass?: string;
  route_from?: string;
  destination?: string;
  consignee?: string;
  requested_pickup?: Date;
  status: string;
  trip_id?: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async createBooking(
    dto: CreateBookingDto,
    tenantId: number,
    createdBy: string,
  ): Promise<BookingResponseDto> {
    // Validate customer exists in tenant
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

    // Validate bilty_no if provided (should be unique per tenant)
    if (dto.bilty_no) {
      const existing = await this.bookingsRepository.findOne({
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

    // Validate booking_date is not in past
    const bookingDate = new Date(dto.booking_date);
    if (bookingDate < new Date()) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Create booking
    const booking = new Booking();
    booking.tenant_id = tenantId;
    booking.customer_id = dto.customer_id;
    booking.booking_date = bookingDate;
    booking.bilty_no = dto.bilty_no || null;
    booking.gate_pass = dto.gate_pass || null;
    booking.route_from = dto.route_from || null;
    booking.destination = dto.destination || null;
    booking.consignee = dto.consignee || null;
    booking.requested_pickup = dto.requested_pickup || null;
    booking.status = 'open'; // Default status
    booking.created_by = createdBy;
    booking.updated_by = createdBy;

    const savedBooking = await this.bookingsRepository.save(booking);
    return this.toResponseDto(savedBooking);
  }

  async getBookings(tenantId: number): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingsRepository.find({
      where: {
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return bookings.map((b) => this.toResponseDto(b));
  }

  async getBookingById(id: number, tenantId: number): Promise<BookingResponseDto> {
    const booking = await this.bookingsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.toResponseDto(booking);
  }

  async updateBooking(
    id: number,
    dto: UpdateBookingDto,
    tenantId: number,
    updatedBy: string,
  ): Promise<BookingResponseDto> {
    // Find booking
    const booking = await this.bookingsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // If changing customer, validate it exists
    if (dto.customer_id && dto.customer_id !== booking.customer_id) {
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

      booking.customer_id = dto.customer_id;
    }

    // Validate bilty_no if changing
    if (dto.bilty_no && dto.bilty_no !== booking.bilty_no) {
      const existing = await this.bookingsRepository.findOne({
        where: {
          tenant_id: tenantId,
          bilty_no: dto.bilty_no,
          deleted_at: IsNull(),
        },
      });

      if (existing) {
        throw new ConflictException('Bilty number already exists');
      }

      booking.bilty_no = dto.bilty_no;
    }

    // Update other fields
    if (dto.billing_date !== undefined) booking.booking_date = new Date(dto.billing_date);
    if (dto.gate_pass !== undefined) booking.gate_pass = dto.gate_pass;
    if (dto.route_from !== undefined) booking.route_from = dto.route_from;
    if (dto.destination !== undefined) booking.destination = dto.destination;
    if (dto.consignee !== undefined) booking.consignee = dto.consignee;
    if (dto.requested_pickup !== undefined) booking.requested_pickup = dto.requested_pickup ? new Date(dto.requested_pickup) : null;

    // Validate status if changing
    if (dto.status) {
      const validStatuses = ['open', 'converted', 'booked'];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException('Invalid status. Must be: open, converted, or booked');
      }
      booking.status = dto.status;
    }

    booking.updated_by = updatedBy;
    booking.updated_at = new Date();

    const savedBooking = await this.bookingsRepository.save(booking);
    return this.toResponseDto(savedBooking);
  }

  async deleteBooking(id: number, tenantId: number): Promise<{ message: string }> {
    const booking = await this.bookingsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only allow deleting 'open' bookings
    if (booking.status !== 'open') {
      throw new BadRequestException(
        'Can only delete bookings with status "open"',
      );
    }

    // Soft delete
    booking.deleted_at = new Date();
    await this.bookingsRepository.save(booking);

    return { message: 'Booking deleted successfully' };
  }

  async getBookingsByCustomer(
    customerId: number,
    tenantId: number,
  ): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingsRepository.find({
      where: {
        customer_id: customerId,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return bookings.map((b) => this.toResponseDto(b));
  }

  private toResponseDto(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      customer_id: booking.customer_id,
      booking_date: booking.booking_date,
      bilty_no: booking.bilty_no,
      gate_pass: booking.gate_pass,
      route_from: booking.route_from,
      destination: booking.destination,
      consignee: booking.consignee,
      requested_pickup: booking.requested_pickup,
      status: booking.status,
      trip_id: booking.trip_id,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      created_by: booking.created_by,
    };
  }
}
