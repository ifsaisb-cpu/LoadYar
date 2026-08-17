import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class JournalLineDto {
  account_id: number;
  debit_paisa?: number;
  credit_paisa?: number;
}

export class CreateJournalEntryDto {
  entry_date: Date;
  description: string;
  reference_type?: string; // trip, expense, payment, etc
  reference_id?: number;
  lines: JournalLineDto[]; // Debit/credit pairs
}

export class JournalEntryResponseDto {
  id: number;
  entry_date: Date;
  description: string;
  reference_type?: string;
  reference_id?: number;
  lines: Array<{
    account_id: number;
    debit_paisa?: number;
    credit_paisa?: number;
  }>;
  posted_by: string;
  posted_at: Date;
  created_at: Date;
  updated_at: Date;
  is_balanced: boolean;
}

@Injectable()
export class JournalEntryService {
  constructor(
    @InjectRepository('journal_entries')
    private journalRepository: any,
  ) {}

  async createEntry(
    dto: CreateJournalEntryDto,
    tenantId: number,
    postedBy: string,
  ): Promise<JournalEntryResponseDto> {
    // Validate required fields
    if (!dto.entry_date || !dto.description || !dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Entry date, description, and journal lines are required');
    }

    // Validate double-entry (debits must equal credits)
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of dto.lines) {
      if ((!line.debit_paisa || line.debit_paisa === 0) &&
          (!line.credit_paisa || line.credit_paisa === 0)) {
        throw new BadRequestException('Each line must have either a debit or credit amount');
      }

      if (line.debit_paisa && line.credit_paisa) {
        throw new BadRequestException('A line cannot have both debit and credit amounts');
      }

      if (line.debit_paisa) totalDebits += line.debit_paisa;
      if (line.credit_paisa) totalCredits += line.credit_paisa;
    }

    // Must be balanced (debits = credits)
    if (totalDebits !== totalCredits) {
      throw new BadRequestException(
        `Journal entry is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
      );
    }

    // In production, would save to database
    // For now, return placeholder

    return {
      id: Math.floor(Math.random() * 10000),
      entry_date: new Date(dto.entry_date),
      description: dto.description,
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      lines: dto.lines,
      posted_by: postedBy,
      posted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      is_balanced: totalDebits === totalCredits,
    };
  }

  async getEntries(tenantId: number): Promise<JournalEntryResponseDto[]> {
    // Return empty for now
    return [];
  }

  async getEntriesByReference(
    refType: string,
    refId: number,
    tenantId: number,
  ): Promise<JournalEntryResponseDto[]> {
    return [];
  }

  /**
   * Post an expense to GL:
   * Debit: Fuel/Toll/Salary account
   * Credit: Bank account
   */
  async postExpenseEntry(
    expenseType: string,
    amount_paisa: number,
    expenseId: number,
    postedBy: string,
    tenantId: number,
  ): Promise<JournalEntryResponseDto> {
    // Map expense types to GL accounts (in production would use a config)
    const accountMap: { [key: string]: { debit: number; credit: number } } = {
      fuel: { debit: 4, credit: 1 }, // Debit Fuel, Credit Bank
      toll_tax: { debit: 6, credit: 1 }, // Debit Toll, Credit Bank
      driver_advance: { debit: 5, credit: 1 }, // Debit Salary, Credit Bank
      maintenance: { debit: 6, credit: 1 }, // Debit Maintenance, Credit Bank
      food: { debit: 6, credit: 1 }, // Debit Misc, Credit Bank
    };

    const accounts = accountMap[expenseType] || accountMap['fuel'];

    const entry: CreateJournalEntryDto = {
      entry_date: new Date(),
      description: `Expense: ${expenseType}`,
      reference_type: 'expense',
      reference_id: expenseId,
      lines: [
        {
          account_id: accounts.debit,
          debit_paisa: amount_paisa,
        },
        {
          account_id: accounts.credit,
          credit_paisa: amount_paisa,
        },
      ],
    };

    return this.createEntry(entry, tenantId, postedBy);
  }

  /**
   * Post a trip revenue to GL:
   * Debit: Bank account (or A/R)
   * Credit: Freight Revenue
   */
  async postRevenueEntry(
    tripId: number,
    amount_paisa: number,
    postedBy: string,
    tenantId: number,
  ): Promise<JournalEntryResponseDto> {
    const entry: CreateJournalEntryDto = {
      entry_date: new Date(),
      description: `Trip Revenue #${tripId}`,
      reference_type: 'trip',
      reference_id: tripId,
      lines: [
        {
          account_id: 1, // Bank
          debit_paisa: amount_paisa,
        },
        {
          account_id: 3, // Freight Revenue
          credit_paisa: amount_paisa,
        },
      ],
    };

    return this.createEntry(entry, tenantId, postedBy);
  }

  /**
   * Post a payment to GL:
   * Debit: Bank account
   * Credit: A/P or other liability
   */
  async postPaymentEntry(
    paymentType: string,
    amount_paisa: number,
    paymentId: number,
    postedBy: string,
    tenantId: number,
  ): Promise<JournalEntryResponseDto> {
    const entry: CreateJournalEntryDto = {
      entry_date: new Date(),
      description: `Payment: ${paymentType}`,
      reference_type: 'payment',
      reference_id: paymentId,
      lines: [
        {
          account_id: 2, // A/P
          debit_paisa: amount_paisa,
        },
        {
          account_id: 1, // Bank
          credit_paisa: amount_paisa,
        },
      ],
    };

    return this.createEntry(entry, tenantId, postedBy);
  }
}
