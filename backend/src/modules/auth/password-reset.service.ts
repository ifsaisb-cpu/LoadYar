import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Session } from '../../entities/session.entity';
import * as bcrypt from 'bcrypt';

interface PasswordResetPayload {
  sub: number;
  username: string;
  type: 'password_reset';
}

@Injectable()
export class PasswordResetService {
  private readonly RESET_TOKEN_EXPIRY = '15m'; // 15 minutes

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  async requestPasswordReset(username: string): Promise<{ message: string; reset_token?: string }> {
    // Find user by username
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return {
        message: 'If user exists, password reset instructions have been sent',
      };
    }

    if (user.status !== 'active') {
      throw new BadRequestException('Cannot reset password for inactive user');
    }

    // Generate password reset token (15-minute expiry)
    const payload: PasswordResetPayload = {
      sub: user.id,
      username: user.username,
      type: 'password_reset',
    };

    const resetToken = this.jwtService.sign(payload, {
      expiresIn: this.RESET_TOKEN_EXPIRY,
    });

    // TODO: Send email with reset link
    // For MVP, return token in response (in production, send via email only)
    return {
      message: 'Password reset token generated',
      reset_token: resetToken, // Remove in production, send via email instead
    };
  }

  async validateResetToken(token: string): Promise<PasswordResetPayload> {
    try {
      const payload = this.jwtService.verify(token) as PasswordResetPayload;

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Validate token
    const payload = await this.validateResetToken(token);

    // Validate password strength
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, and numbers',
      );
    }

    // Find user
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password_hash = passwordHash;
    user.updated_at = new Date();
    await this.usersRepository.save(user);

    // Invalidate all existing sessions for this user (force re-login)
    await this.sessionsRepository.update(
      { user_id: user.id, is_active: true },
      { is_active: false },
    );

    return {
      message: 'Password reset successfully. Please log in with your new password.',
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find user
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    if (!user.password_hash) {
      throw new BadRequestException('User does not have a password set');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, and numbers',
      );
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    user.updated_at = new Date();
    await this.usersRepository.save(user);

    return {
      message: 'Password changed successfully',
    };
  }
}
