import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthUser, JwtPayload } from './auth-user.interface';
import { IS_PUBLIC_KEY } from './public.decorator';

// Registered as a global APP_GUARD: every route requires a valid Bearer token
// unless explicitly marked @Public().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user: AuthUser = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      driverId: payload.driverId ?? null,
      carrierId: payload.carrierId ?? null,
    };
    request.user = user;
    return true;
  }

  private extractBearerToken(request: {
    headers: Record<string, string | undefined>;
  }): string | null {
    const header = request.headers['authorization'];
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
