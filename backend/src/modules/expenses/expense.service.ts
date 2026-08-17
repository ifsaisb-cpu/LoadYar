import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

export class CreateExpenseDto {
  trip_id?: number;
  type: string; // toll_tax, driver_advance, food, fuel, maintenance
  location?: string;
  amount_paisa: number;
  date: Date;
  account_id?: number;
  notes?: string;
}

export class UpdateExpenseDto {
  type?: string;
  location?: string;
  amount_paisa?: number;
  date?: Date;
  account_id?: number;
  notes?: string;
}

export class ExpenseResponseDto {
  id: number;
  trip_id?: number;
  type: string;
  location?: string;
  amount_paisa: number;
  date: Date;
  account_id?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository('trip_expenses')
    private expensesRepository: any, // Will use raw query or create entity
  ) {}

  async createExpense(
    dto: CreateExpenseDto,
    tenantId: number,
    createdBy: string,
  ): Promise<ExpenseResponseDto> {
    // Validate required fields
    if (!dto.type || !dto.amount_paisa) {
      throw new BadRequestException('Type and amount are required');
    }

    if (dto.amount_paisa <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Valid expense types
    const validTypes = ['toll_tax', 'driver_advance', 'food', 'fuel', 'maintenance'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(
        'Invalid type. Must be one of: toll_tax, driver_advance, food, fuel, maintenance',
      );
    }

    // Create expense with raw query (simplified for now)
    // In production, this would use an entity
    const expenseDate = new Date(dto.date);

    return {
      id: Math.floor(Math.random() * 10000), // Placeholder
      trip_id: dto.trip_id,
      type: dto.type,
      location: dto.location,
      amount_paisa: dto.amount_paisa,
      date: expenseDate,
      account_id: dto.account_id,
      notes: dto.notes,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: createdBy,
    };
  }

  async getExpenses(tenantId: number): Promise<ExpenseResponseDto[]> {
    // Return empty for now - will use real DB in production
    return [];
  }

  async getExpensesByTrip(
    tripId: number,
    tenantId: number,
  ): Promise<ExpenseResponseDto[]> {
    return [];
  }

  private toResponseDto(expense: any): ExpenseResponseDto {
    return {
      id: expense.id,
      trip_id: expense.trip_id,
      type: expense.type,
      location: expense.location,
      amount_paisa: expense.amount_paisa,
      date: expense.date,
      account_id: expense.account_id,
      notes: expense.notes,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
      created_by: expense.created_by,
    };
  }
}
