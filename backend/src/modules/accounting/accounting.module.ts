import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GLAccountService } from './gl-account.service';
import { GLAccountController } from './gl-account.controller';
import { JournalEntryService } from './journal-entry.service';
import { JournalEntryController } from './journal-entry.controller';

@Module({
  imports: [
    // In production, import real entities
    // TypeOrmModule.forFeature([ChartOfAccounts, JournalEntry, JournalLine])
  ],
  controllers: [GLAccountController, JournalEntryController],
  providers: [GLAccountService, JournalEntryService],
  exports: [GLAccountService, JournalEntryService],
})
export class AccountingModule {}
