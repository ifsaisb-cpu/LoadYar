import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from './auth-user.interface';

// Row-level scoping per design doc §5.2: carrier scoping by carrier_id,
// driver scoping by driver_id, enforced in the query layer — every domain
// service must spread this into its Prisma `where` for models that carry
// carrierId/driverId columns (Trip, TripExpense, VehicleConditionChecklist,
// CarrierPayable, ...).
//
// A driver/carrier login whose profile link is missing gets a hard deny
// rather than an accidental unscoped query.
export function rowScope(user: AuthUser): {
  driverId?: string;
  carrierId?: string;
} {
  switch (user.role) {
    case 'admin':
    case 'dispatcher':
      return {};
    case 'driver':
      if (!user.driverId) {
        throw new ForbiddenException('Driver account has no linked driver profile');
      }
      return { driverId: user.driverId };
    case 'carrier':
      if (!user.carrierId) {
        throw new ForbiddenException('Carrier account has no linked carrier profile');
      }
      return { carrierId: user.carrierId };
  }
}
