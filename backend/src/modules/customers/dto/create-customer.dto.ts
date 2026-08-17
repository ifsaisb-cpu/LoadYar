import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  plant?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  delivery_points?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  billing_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ops_contact?: string;
}
