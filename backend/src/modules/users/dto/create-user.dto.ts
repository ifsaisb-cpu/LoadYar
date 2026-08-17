import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscore and dash',
  })
  username: string;

  @IsEnum(['admin', 'dispatcher', 'driver', 'carrier'], {
    message: 'Invalid role. Must be one of: admin, dispatcher, driver, carrier',
  })
  role: string;

  @IsEnum(['click', 'password'], {
    message: 'Invalid auth_mode. Must be either "click" or "password"',
  })
  auth_mode: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, lowercase letter, and number',
  })
  password?: string;

  @IsOptional()
  driver_id?: number;

  @IsOptional()
  carrier_id?: number;
}
