import { Role } from '../../generated/prisma/client';

// Shape of the JWT payload and of `request.user` after JwtAuthGuard runs.
// driverId/carrierId are carried in the token so the query layer can apply
// row-level scoping without an extra user lookup per request.
export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  driverId: string | null;
  carrierId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  driverId: string | null;
  carrierId: string | null;
}
