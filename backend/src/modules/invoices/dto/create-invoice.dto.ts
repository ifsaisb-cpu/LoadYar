import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsNumber()
  trip_id: number;

  @IsNumber()
  customer_id: number;

  @IsString()
  invoice_number: string;

  @IsNumber()
  amount_paisa: number;

  @IsOptional()
  @IsString()
  tax_label?: string;

  @IsOptional()
  @IsNumber()
  tax_paisa?: number;

  @IsDateString()
  invoice_date: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}
