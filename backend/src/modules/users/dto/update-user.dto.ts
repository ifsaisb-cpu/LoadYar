import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(['admin', 'dispatcher', 'driver', 'carrier'], {
    message: 'Invalid role. Must be one of: admin, dispatcher, driver, carrier',
  })
  role?: string;

  @IsOptional()
  @IsEnum(['click', 'password'], {
    message: 'Invalid auth_mode. Must be either "click" or "password"',
  })
  auth_mode?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, lowercase letter, and number',
  })
  password?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'], {
    message: 'Invalid status. Must be either "active" or "inactive"',
  })
  status?: string;

  @IsOptional()
  driver_id?: number;

  @IsOptional()
  carrier_id?: number;
}
