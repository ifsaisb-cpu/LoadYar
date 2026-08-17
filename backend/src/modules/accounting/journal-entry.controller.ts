import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JournalEntryService } from './journal-entry.service';
import { CreateJournalEntryDto } from './journal-entry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('journal-entries')
@UseGuards(JwtAuthGuard)
export class JournalEntryController {
  constructor(private readonly journalService: JournalEntryService) {}

  @Get()
  @Roles('admin', 'dispatcher')
  async getEntries(@Request() req: any) {
    return this.journalService.getEntries(req.user.tenant_id);
  }

  @Get('reference/:refType/:refId')
  @Roles('admin', 'dispatcher')
  async getEntriesByReference(
    @Param('refType') refType: string,
    @Param('refId', ParseIntPipe) refId: number,
    @Request() req: any,
  ) {
    return this.journalService.getEntriesByReference(
      refType,
      refId,
      req.user.tenant_id,
    );
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createEntry(
    @Body() dto: CreateJournalEntryDto,
    @Request() req: any,
  ) {
    return this.journalService.createEntry(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Post('expense')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  async postExpenseEntry(
    @Body()
    dto: {
      expense_type: string;
      amount_paisa: number;
      expense_id: number;
    },
    @Request() req: any,
  ) {
    return this.journalService.postExpenseEntry(
      dto.expense_type,
      dto.amount_paisa,
      dto.expense_id,
      req.user.username,
      req.user.tenant_id,
    );
  }

  @Post('revenue')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  async postRevenueEntry(
    @Body()
    dto: {
      trip_id: number;
      amount_paisa: number;
    },
    @Request() req: any,
  ) {
    return this.journalService.postRevenueEntry(
      dto.trip_id,
      dto.amount_paisa,
      req.user.username,
      req.user.tenant_id,
    );
  }

  @Post('payment')
  @Roles('admin', 'dispatcher')
  @HttpCode(HttpStatus.CREATED)
  async postPaymentEntry(
    @Body()
    dto: {
      payment_type: string;
      amount_paisa: number;
      payment_id: number;
    },
    @Request() req: any,
  ) {
    return this.journalService.postPaymentEntry(
      dto.payment_type,
      dto.amount_paisa,
      dto.payment_id,
      req.user.username,
      req.user.tenant_id,
    );
  }
}
