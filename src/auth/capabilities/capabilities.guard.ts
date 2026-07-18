import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth-user.interface';
import { Capability } from './capability.enum';
import { CAPABILITY_KEY } from './require-capability.decorator';
import { roleHasCapability } from './role-capabilities';

// Registered as a global APP_GUARD after JwtAuthGuard. Routes without a
// @RequireCapability decorator only require authentication; routes with one
// are checked against the §5.2 matrix server-side.
@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Capability | undefined>(
      CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const user: AuthUser | undefined = context
      .switchToHttp()
      .getRequest().user;
    // No user means the route is @Public(); a capability requirement on a
    // public route is a programming error — deny.
    if (!user) {
      throw new ForbiddenException();
    }

    if (!roleHasCapability(user.role, required)) {
      throw new ForbiddenException(
        `Role '${user.role}' is not permitted to perform '${required}'`,
      );
    }
    return true;
  }
}
