import { IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsEnum(['unpaid', 'partial', 'paid'])
  status?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsNumber()
  tax_paisa?: number;
}
