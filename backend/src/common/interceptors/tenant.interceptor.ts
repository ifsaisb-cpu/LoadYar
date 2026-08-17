import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Extract tenant_id from JWT token
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      // Some endpoints don't require auth (login, health check, etc)
      return next.handle();
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = this.decodeToken(token);
      request.user = decoded;
      request.tenant_id = decoded.tenant_id;
    } catch (error) {
      // Invalid token - let JWT guard handle it
      throw new UnauthorizedException('Invalid token');
    }

    return next.handle();
  }

  private decodeToken(token: string): any {
    try {
      // Basic JWT decode (payload only, no signature validation)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token');
      }
      const decoded = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8'),
      );
      return decoded;
    } catch (error) {
      throw new Error('Failed to decode token');
    }
  }
}
