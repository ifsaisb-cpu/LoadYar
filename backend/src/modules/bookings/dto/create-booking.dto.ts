import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  customer_id: number;

  @IsDateString()
  booking_date: string;

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
}
