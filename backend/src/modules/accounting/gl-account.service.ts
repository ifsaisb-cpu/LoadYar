import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

export class CreateGLAccountDto {
  code: string; // e.g., "1001", "2001", "5001"
  name: string;
  type: string; // Asset, Liability, Equity, Revenue, Expense, Suspense
  sub_type?: string;
  opening_paisa?: number;
  is_system_account?: boolean;
}

export class GLAccountResponseDto {
  id: number;
  code: string;
  name: string;
  type: string;
  sub_type?: string;
  opening_paisa: number;
  is_system_account: boolean;
  current_balance?: number; // Calculated from journal entries
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class GLAccountService {
  constructor(
    @InjectRepository('chart_of_accounts')
    private accountsRepository: any,
  ) {}

  async createAccount(
    dto: CreateGLAccountDto,
    tenantId: number,
    createdBy: string,
  ): Promise<GLAccountResponseDto> {
    // Validate required fields
    if (!dto.code || !dto.name || !dto.type) {
      throw new BadRequestException('Code, name, and type are required');
    }

    // Valid account types
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Suspense'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException('Invalid account type');
    }

    // Check for duplicate code per tenant
    // In production would query database
    // For now, placeholder logic

    return {
      id: Math.floor(Math.random() * 10000),
      code: dto.code,
      name: dto.name,
      type: dto.type,
      sub_type: dto.sub_type,
      opening_paisa: dto.opening_paisa || 0,
      is_system_account: dto.is_system_account || false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  async getAccounts(tenantId: number): Promise<GLAccountResponseDto[]> {
    // Return standard chart of accounts
    const standardAccounts = [
      {
        id: 1,
        code: '1001',
        name: 'Bank Account',
        type: 'Asset',
        sub_type: 'Cash & Bank',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        code: '2001',
        name: 'Accounts Payable',
        type: 'Liability',
        sub_type: 'Trade Payables',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        code: '5001',
        name: 'Freight Revenue',
        type: 'Revenue',
        sub_type: 'Operating Revenue',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        code: '6001',
        name: 'Fuel Expense',
        type: 'Expense',
        sub_type: 'Operating Expense',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        code: '6002',
        name: 'Driver Salaries',
        type: 'Expense',
        sub_type: 'Payroll',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 6,
        code: '6003',
        name: 'Toll & Tax',
        type: 'Expense',
        sub_type: 'Operating Expense',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 7,
        code: '9999',
        name: 'Suspense Account',
        type: 'Suspense',
        sub_type: 'Temporary',
        opening_paisa: 0,
        is_system_account: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    return standardAccounts;
  }

  async getAccountById(id: number, tenantId: number): Promise<GLAccountResponseDto> {
    const accounts = await this.getAccounts(tenantId);
    const account = accounts.find((a) => a.id === id);

    if (!account) {
      throw new NotFoundException('GL Account not found');
    }

    return account;
  }

  async getAccountByCode(
    code: string,
    tenantId: number,
  ): Promise<GLAccountResponseDto> {
    const accounts = await this.getAccounts(tenantId);
    const account = accounts.find((a) => a.code === code);

    if (!account) {
      throw new NotFoundException(`GL Account with code ${code} not found`);
    }

    return account;
  }

  async getAccountBalance(
    accountId: number,
    tenantId: number,
  ): Promise<{ account: GLAccountResponseDto; balance: number }> {
    const account = await this.getAccountById(accountId, tenantId);

    // In production, would calculate balance from journal_lines
    // For now, return opening balance
    return {
      account,
      balance: account.opening_paisa,
    };
  }

  private toResponseDto(account: any): GLAccountResponseDto {
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      sub_type: account.sub_type,
      opening_paisa: account.opening_paisa,
      is_system_account: account.is_system_account,
      created_at: account.created_at,
      updated_at: account.updated_at,
    };
  }
}
