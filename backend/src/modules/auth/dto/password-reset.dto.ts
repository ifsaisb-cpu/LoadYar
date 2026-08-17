import { IsString, MinLength, Matches } from 'class-validator';

export class PasswordResetRequestDto {
  @IsString()
  username: string;
}

export class PasswordResetDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, lowercase letter, and number',
  })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  current_password: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, lowercase letter, and number',
  })
  new_password: string;
}
