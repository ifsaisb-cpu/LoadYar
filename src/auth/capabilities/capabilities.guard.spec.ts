import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma/client';
import { AuthUser } from '../auth-user.interface';
import { CapabilitiesGuard } from './capabilities.guard';
import { Capability } from './capability.enum';

function contextFor(user: AuthUser | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function userWithRole(role: Role): AuthUser {
  return {
    userId: 'u1',
    email: `${role}@test.local`,
    role,
    driverId: role === 'driver' ? 'd1' : null,
    carrierId: role === 'carrier' ? 'c1' : null,
  };
}

describe('CapabilitiesGuard (§5.2 permission matrix)', () => {
  let guard: CapabilitiesGuard;
  let requiredCapability: Capability | undefined;

  beforeEach(() => {
    const reflector = {
      getAllAndOverride: () => requiredCapability,
    } as unknown as Reflector;
    guard = new CapabilitiesGuard(reflector);
  });

  // The §5.2 matrix, row by row: capability -> roles allowed.
  const MATRIX: [Capability, Role[]][] = [
    [Capability.REPORTS_DASHBOARD, ['admin']],
    [Capability.FINANCIAL_SUMMARIES, ['admin']],
    [Capability.BOOKINGS_TRIPS_ENTRY, ['admin', 'dispatcher']],
    [Capability.INVOICES_PAYMENTS_ENTRY, ['admin', 'dispatcher']],
    [Capability.TRIP_EXPENSES_ENTRY, ['admin', 'dispatcher', 'driver']],
    [Capability.CHECKLIST_ENTRY, ['admin', 'dispatcher', 'driver']],
    [Capability.DELIVERY_STATUS_UPDATE, ['admin', 'dispatcher', 'driver']],
    [Capability.CLAIMS_ENTRY, ['admin', 'dispatcher']],
    [Capability.MASTER_DATA, ['admin']],
    [
      Capability.VIEW_OWN_TRIPS_PAYMENTS,
      ['admin', 'dispatcher', 'driver', 'carrier'],
    ],
  ];
  const ALL_ROLES: Role[] = ['admin', 'dispatcher', 'driver', 'carrier'];

  for (const [capability, allowedRoles] of MATRIX) {
    for (const role of ALL_ROLES) {
      const allowed = allowedRoles.includes(role);
      it(`${allowed ? 'allows' : 'denies'} ${role} -> ${capability}`, () => {
        requiredCapability = capability;
        const ctx = contextFor(userWithRole(role));
        if (allowed) {
          expect(guard.canActivate(ctx)).toBe(true);
        } else {
          expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
        }
      });
    }
  }

  it('allows any authenticated user when no capability is required', () => {
    requiredCapability = undefined;
    expect(guard.canActivate(contextFor(userWithRole('carrier')))).toBe(true);
  });

  it('denies when a capability is required but there is no user', () => {
    requiredCapability = Capability.REPORTS_DASHBOARD;
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
