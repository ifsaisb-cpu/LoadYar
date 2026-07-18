import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from './auth-user.interface';
import { rowScope } from './row-scope';

function user(partial: Partial<AuthUser>): AuthUser {
  return {
    userId: 'u1',
    email: 'x@test.local',
    role: 'admin',
    driverId: null,
    carrierId: null,
    ...partial,
  };
}

describe('rowScope (§5.2 row-level scoping)', () => {
  it('leaves admin unscoped', () => {
    expect(rowScope(user({ role: 'admin' }))).toEqual({});
  });

  it('leaves dispatcher unscoped', () => {
    expect(rowScope(user({ role: 'dispatcher' }))).toEqual({});
  });

  it('scopes driver to own driver_id', () => {
    expect(rowScope(user({ role: 'driver', driverId: 'd1' }))).toEqual({
      driverId: 'd1',
    });
  });

  it('scopes carrier to own carrier_id', () => {
    expect(rowScope(user({ role: 'carrier', carrierId: 'c1' }))).toEqual({
      carrierId: 'c1',
    });
  });

  it('denies a driver login with no linked driver profile', () => {
    expect(() => rowScope(user({ role: 'driver' }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies a carrier login with no linked carrier profile', () => {
    expect(() => rowScope(user({ role: 'carrier' }))).toThrow(
      ForbiddenException,
    );
  });
});
