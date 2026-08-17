import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsOptional()
  tenant_id?: number;
}

export class TenantSelectionDto {
  @IsOptional()
  tenant_id: number;
}

export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string;
    username: string;
    role: string;
    tenant_id: number;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
}
