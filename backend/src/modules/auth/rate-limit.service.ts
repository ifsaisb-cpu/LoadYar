import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { UserLoginAttempt } from '../../entities/user-login-attempt.entity';

@Injectable()
export class RateLimitService {
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(UserLoginAttempt)
    private attemptsRepository: Repository<UserLoginAttempt>,
  ) {}

  async recordAttempt(
    username: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string,
  ): Promise<void> {
    // Record the login attempt
    const attempt = this.attemptsRepository.create({
      username,
      success,
      ip_address: ipAddress,
      user_agent: userAgent,
      failure_reason: failureReason,
      timestamp: new Date(),
    });

    await this.attemptsRepository.save(attempt);

    // If successful, clear failed attempts for this username
    if (success) {
      await this.clearFailedAttempts(username);
    } else {
      // If failed, check if we should lock the account
      const failedCount = await this.getFailedAttemptCount(username);
      if (failedCount >= this.MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
        await this.attemptsRepository.update(
          { username },
          { locked_until: lockedUntil },
        );
      }
    }
  }

  async isLocked(username: string): Promise<boolean> {
    const attempt = await this.attemptsRepository.findOne({
      where: {
        username,
        locked_until: MoreThan(new Date()),
      },
      order: { timestamp: 'DESC' },
    });

    return !!attempt;
  }

  async getLockoutRemainingSeconds(username: string): Promise<number> {
    const attempt = await this.attemptsRepository.findOne({
      where: {
        username,
        locked_until: MoreThan(new Date()),
      },
      order: { timestamp: 'DESC' },
    });

    if (!attempt || !attempt.locked_until) {
      return 0;
    }

    const remaining = Math.ceil(
      (attempt.locked_until.getTime() - Date.now()) / 1000,
    );
    return Math.max(0, remaining);
  }

  async getFailedAttemptCount(username: string): Promise<number> {
    const windowStart = new Date(Date.now() - this.ATTEMPT_WINDOW_MS);

    const count = await this.attemptsRepository.count({
      where: {
        username,
        success: false,
        timestamp: MoreThan(windowStart),
      },
    });

    return count;
  }

  private async clearFailedAttempts(username: string): Promise<void> {
    const windowStart = new Date(Date.now() - this.ATTEMPT_WINDOW_MS);

    await this.attemptsRepository.delete({
      username,
      success: false,
      timestamp: LessThan(windowStart),
    });

    // Clear lockout
    await this.attemptsRepository.update(
      { username },
      { locked_until: null },
    );
  }

  async getLoginHistory(
    username: string,
    limit: number = 10,
  ): Promise<UserLoginAttempt[]> {
    return this.attemptsRepository.find({
      where: { username },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async cleanupOldAttempts(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await this.attemptsRepository.delete({
      timestamp: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }
}
