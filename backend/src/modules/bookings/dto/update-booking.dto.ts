import { IsNumber, IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsDateString()
  billing_date?: string;

  @IsOptional()
  @IsString()
  bilty_no?: string;

  @IsOptional()
  @IsString()
  gate_pass?: string;

  @IsOptional()
  @IsString()
  route_from?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  consignee?: string;

  @IsOptional()
  @IsDateString()
  requested_pickup?: string;

  @IsOptional()
  @IsEnum(['open', 'converted', 'booked'], {
    message: 'Status must be one of: open, converted, booked',
  })
  status?: string;
}
