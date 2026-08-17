import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RateLimitService } from './rate-limit.service';
import { PasswordResetService } from './password-reset.service';
import { SessionTimeoutMiddleware } from './session-timeout.middleware';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Session } from '../../entities/session.entity';
import { UserLoginAttempt } from '../../entities/user-login-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Session, UserLoginAttempt]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RateLimitService, PasswordResetService],
  exports: [AuthService, RateLimitService, PasswordResetService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionTimeoutMiddleware).forRoutes('*');
  }
}
