import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import { Session } from '../../entities/session.entity';

@Injectable()
export class SessionTimeoutMiddleware implements NestMiddleware {
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes (configurable via env)

  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip auth-related endpoints
    if (
      req.path.includes('/auth/login') ||
      req.path.includes('/auth/password-reset') ||
      req.path.includes('/health')
    ) {
      return next();
    }

    // Check if user has JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    try {
      // Get session from database if user authenticated
      if (req.user && req.user.userId) {
        const session = await this.sessionsRepository.findOne({
          where: {
            user_id: req.user.userId,
            is_active: true,
          },
          order: { created_at: 'DESC' },
        });

        if (!session) {
          throw new UnauthorizedException('Session not found');
        }

        if (!session.is_active) {
          throw new UnauthorizedException('Session is inactive');
        }

        // Check session expiration
        if (session.expires_at && session.expires_at < new Date()) {
          throw new UnauthorizedException('Session expired');
        }

        // Check inactivity timeout
        const inactiveMs = Date.now() - session.last_activity_at.getTime();
        if (inactiveMs > this.SESSION_TIMEOUT_MS) {
          // Expire session
          session.is_active = false;
          await this.sessionsRepository.save(session);
          throw new UnauthorizedException(
            'Session expired due to inactivity (30 minutes)',
          );
        }

        // Update last activity timestamp
        session.last_activity_at = new Date();
        await this.sessionsRepository.save(session);
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      next();
    }
  }
}
