import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export class CreateTripDto {
  @IsString()
  bilty_no: string;

  @IsOptional()
  @IsNumber()
  booking_id?: number;

  @IsOptional()
  @IsEnum(['digital', 'manual_logged'])
  entry_mode?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  customer_id: number;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  consigner?: string;

  @IsString()
  consignee: string;

  @IsOptional()
  @IsString()
  consignee_address?: string;

  @IsOptional()
  @IsNumber()
  carrier_id?: number;

  @IsOptional()
  @IsNumber()
  driver_id?: number;

  @IsOptional()
  @IsString()
  booking_time?: string;

  @IsOptional()
  @IsString()
  return_load_type?: string;

  @IsOptional()
  @IsNumber()
  freight_paisa?: number;

  @IsOptional()
  @IsBoolean()
  open_market?: boolean;

  @IsOptional()
  @IsNumber()
  rate_agreement_id?: number;

  @IsOptional()
  @IsBoolean()
  rate_overridden?: boolean;

  @IsOptional()
  @IsString()
  media_ref?: string;

  @IsOptional()
  @IsString()
  veh_make?: string;

  @IsOptional()
  @IsString()
  veh_type?: string;

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
  veh_model?: string;

  @IsOptional()
  @IsString()
  veh_reg?: string;

  @IsOptional()
  @IsString()
  veh_condition?: string;

  @IsOptional()
  @IsNumber()
  agent_id?: number;

  @IsOptional()
  @IsNumber()
  agent_cost_paisa?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  load_from?: string;

  @IsOptional()
  @IsString()
  load_to?: string;
}
