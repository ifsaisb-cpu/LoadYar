import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { Trip } from '../../entities/trip.entity';
import { Customer } from '../../entities/customer.entity';

export class CreateInvoiceDto {
  trip_id: number;
  customer_id: number;
  invoice_number: string;
  amount_paisa: number;
  tax_label?: string;
  tax_paisa?: number;
  invoice_date: Date;
  due_date?: Date;
}

export class UpdateInvoiceDto {
  status?: string; // unpaid, partial, paid
  due_date?: Date;
  tax_paisa?: number;
}

export class InvoiceResponseDto {
  id: number;
  trip_id: number;
  customer_id: number;
  invoice_number: string;
  amount_paisa: number;
  tax_label?: string;
  tax_paisa: number;
  status: string;
  invoice_date: Date;
  due_date?: Date;
  total_paisa: number; // amount + tax
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async createInvoice(
    dto: CreateInvoiceDto,
    tenantId: number,
    createdBy: string,
  ): Promise<InvoiceResponseDto> {
    // Validate trip exists
    const trip = await this.tripsRepository.findOne({
      where: {
        id: dto.trip_id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

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

    // Validate invoice number uniqueness per tenant
    if (dto.invoice_number) {
      const existing = await this.invoicesRepository.findOne({
        where: {
          tenant_id: tenantId,
          invoice_number: dto.invoice_number,
        },
      });

      if (existing) {
        throw new ConflictException('Invoice number already exists');
      }
    }

    // Validate amount
    if (!dto.amount_paisa || dto.amount_paisa <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Create invoice
    const invoice = new Invoice();
    invoice.tenant_id = tenantId;
    invoice.trip_id = dto.trip_id;
    invoice.customer_id = dto.customer_id;
    invoice.invoice_number = dto.invoice_number;
    invoice.amount_paisa = dto.amount_paisa;
    invoice.tax_label = dto.tax_label || null;
    invoice.tax_paisa = dto.tax_paisa || 0;
    invoice.status = 'unpaid';
    invoice.invoice_date = new Date(dto.invoice_date);
    invoice.due_date = dto.due_date ? new Date(dto.due_date) : null;
    invoice.created_by = createdBy;
    invoice.updated_by = createdBy;

    const savedInvoice = await this.invoicesRepository.save(invoice);
    return this.toResponseDto(savedInvoice);
  }

  async getInvoices(tenantId: number): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoicesRepository.find({
      where: {
        tenant_id: tenantId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return invoices.map((inv) => this.toResponseDto(inv));
  }

  async getInvoiceById(id: number, tenantId: number): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toResponseDto(invoice);
  }

  async updateInvoice(
    id: number,
    dto: UpdateInvoiceDto,
    tenantId: number,
    updatedBy: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Validate status if changing
    if (dto.status) {
      const validStatuses = ['unpaid', 'partial', 'paid'];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException('Invalid status. Must be: unpaid, partial, or paid');
      }
      invoice.status = dto.status;
    }

    // Update optional fields
    if (dto.due_date !== undefined) invoice.due_date = dto.due_date ? new Date(dto.due_date) : null;
    if (dto.tax_paisa !== undefined) invoice.tax_paisa = dto.tax_paisa;

    invoice.updated_by = updatedBy;
    invoice.updated_at = new Date();

    const savedInvoice = await this.invoicesRepository.save(invoice);
    return this.toResponseDto(savedInvoice);
  }

  async getInvoicesByCustomer(
    customerId: number,
    tenantId: number,
  ): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoicesRepository.find({
      where: {
        customer_id: customerId,
        tenant_id: tenantId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return invoices.map((inv) => this.toResponseDto(inv));
  }

  async getInvoicesByStatus(
    status: string,
    tenantId: number,
  ): Promise<InvoiceResponseDto[]> {
    const validStatuses = ['unpaid', 'partial', 'paid'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const invoices = await this.invoicesRepository.find({
      where: {
        status,
        tenant_id: tenantId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return invoices.map((inv) => this.toResponseDto(inv));
  }

  async getInvoicesByTrip(
    tripId: number,
    tenantId: number,
  ): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoicesRepository.find({
      where: {
        trip_id: tripId,
        tenant_id: tenantId,
      },
    });

    return invoices.map((inv) => this.toResponseDto(inv));
  }

  private toResponseDto(invoice: Invoice): InvoiceResponseDto {
    const totalPaisa = Number(invoice.amount_paisa) + Number(invoice.tax_paisa);
    return {
      id: invoice.id,
      trip_id: invoice.trip_id,
      customer_id: invoice.customer_id,
      invoice_number: invoice.invoice_number,
      amount_paisa: Number(invoice.amount_paisa),
      tax_label: invoice.tax_label,
      tax_paisa: Number(invoice.tax_paisa),
      status: invoice.status,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_paisa: totalPaisa,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
    };
  }
}
