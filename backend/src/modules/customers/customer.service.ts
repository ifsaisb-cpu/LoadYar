import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Customer } from '../../entities/customer.entity';

export class CreateCustomerDto {
  name: string;
  plant?: string;
  delivery_points?: string;
  billing_contact?: string;
  ops_contact?: string;
}

export class UpdateCustomerDto {
  name?: string;
  plant?: string;
  delivery_points?: string;
  billing_contact?: string;
  ops_contact?: string;
}

export class CustomerResponseDto {
  id: number;
  name: string;
  plant?: string;
  delivery_points?: string;
  billing_contact?: string;
  ops_contact?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async createCustomer(
    dto: CreateCustomerDto,
    tenantId: number,
    createdBy: string,
  ): Promise<CustomerResponseDto> {
    // Validate required fields
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Customer name is required');
    }

    if (dto.name.length > 255) {
      throw new BadRequestException('Customer name must be 255 characters or less');
    }

    // Check for duplicate customer name in tenant
    const existing = await this.customersRepository.findOne({
      where: {
        tenant_id: tenantId,
        name: dto.name,
        deleted_at: IsNull(),
      },
    });

    if (existing) {
      throw new ConflictException('Customer with this name already exists');
    }

    // Create customer
    const customer = new Customer();
    customer.tenant_id = tenantId;
    customer.name = dto.name;
    customer.plant = dto.plant || null;
    customer.delivery_points = dto.delivery_points || null;
    customer.billing_contact = dto.billing_contact || null;
    customer.ops_contact = dto.ops_contact || null;
    customer.created_by = createdBy;
    customer.updated_by = createdBy;

    const savedCustomer = await this.customersRepository.save(customer);
    return this.toResponseDto(savedCustomer);
  }

  async getCustomers(tenantId: number): Promise<CustomerResponseDto[]> {
    const customers = await this.customersRepository.find({
      where: {
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return customers.map((c) => this.toResponseDto(c));
  }

  async getCustomerById(
    id: number,
    tenantId: number,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.toResponseDto(customer);
  }

  async updateCustomer(
    id: number,
    dto: UpdateCustomerDto,
    tenantId: number,
    updatedBy: string,
  ): Promise<CustomerResponseDto> {
    // Find customer in tenant
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check for duplicate name if changing
    if (dto.name && dto.name !== customer.name) {
      const existing = await this.customersRepository.findOne({
        where: {
          tenant_id: tenantId,
          name: dto.name,
          deleted_at: IsNull(),
        },
      });

      if (existing) {
        throw new ConflictException('Customer with this name already exists');
      }

      if (dto.name.length > 255) {
        throw new BadRequestException('Customer name must be 255 characters or less');
      }

      customer.name = dto.name;
    }

    // Update optional fields
    if (dto.plant !== undefined) customer.plant = dto.plant;
    if (dto.delivery_points !== undefined) customer.delivery_points = dto.delivery_points;
    if (dto.billing_contact !== undefined) customer.billing_contact = dto.billing_contact;
    if (dto.ops_contact !== undefined) customer.ops_contact = dto.ops_contact;

    customer.updated_by = updatedBy;
    customer.updated_at = new Date();

    const savedCustomer = await this.customersRepository.save(customer);
    return this.toResponseDto(savedCustomer);
  }

  async deleteCustomer(id: number, tenantId: number): Promise<{ message: string }> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Soft delete
    customer.deleted_at = new Date();
    await this.customersRepository.save(customer);

    return { message: 'Customer deleted successfully' };
  }

  private toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      plant: customer.plant,
      delivery_points: customer.delivery_points,
      billing_contact: customer.billing_contact,
      ops_contact: customer.ops_contact,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      created_by: customer.created_by,
    };
  }
}
