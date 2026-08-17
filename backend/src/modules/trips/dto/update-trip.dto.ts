import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsEnum(['booked', 'in_transit', 'delivered', 'closed'])
  status?: string;

  @IsOptional()
  @IsNumber()
  freight_paisa?: number;

  @IsOptional()
  @IsBoolean()
  rate_overridden?: boolean;

  @IsOptional()
  @IsNumber()
  carrier_id?: number;

  @IsOptional()
  @IsNumber()
  driver_id?: number;

  @IsOptional()
  @IsString()
  consignee_address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  veh_condition?: string;

  @IsOptional()
  @IsString()
  veh_make?: string;

  @IsOptional()
  @IsString()
  veh_model?: string;

  @IsOptional()
  @IsString()
  veh_chassis?: string;

  @IsOptional()
  @IsString()
  veh_engine?: string;

  @IsOptional()
  @IsString()
  veh_colour?: string;

  @IsOptional()
  @IsString()
  veh_reg?: string;

  @IsOptional()
  @IsString()
  veh_type?: string;

  @IsOptional()
  @IsEnum(['to_be_billed', 'to_pay', 'partial', 'paid'])
  pay_status?: string;
}
