import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RateLimitService } from './rate-limit.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import {
  PasswordResetRequestDto,
  PasswordResetDto,
  ChangePasswordDto,
} from './dto/password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rateLimitService: RateLimitService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Request() req: any,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Check if account is locked due to too many failed attempts
    const isLocked = await this.rateLimitService.isLocked(dto.username);
    if (isLocked) {
      const remaining = await this.rateLimitService.getLockoutRemainingSeconds(
        dto.username,
      );
      await this.rateLimitService.recordAttempt(
        dto.username,
        false,
        ipAddress,
        userAgent,
        'Account locked due to too many failed attempts',
      );
      throw new Error(
        `Account locked. Please try again in ${remaining} seconds.`,
      );
    }

    try {
      const result = await this.authService.login(dto, ipAddress);

      // Record successful login
      await this.rateLimitService.recordAttempt(
        dto.username,
        true,
        ipAddress,
        userAgent,
      );

      return result;
    } catch (error) {
      // Record failed login attempt
      await this.rateLimitService.recordAttempt(
        dto.username,
        false,
        ipAddress,
        userAgent,
        error.message,
      );
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any): Promise<{ message: string }> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    await this.authService.logout(req.user.userId, token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: any) {
    return {
      user: req.user,
      timestamp: new Date(),
    };
  }

  @Get('tenants')
  @UseGuards(JwtAuthGuard)
  async getAvailableTenants(@Request() req: any) {
    return this.authService.getAvailableTenants(req.user.userId);
  }

  @Post('password-reset-request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.passwordResetService.requestPasswordReset(dto.username);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: PasswordResetDto) {
    return this.passwordResetService.resetPassword(dto.token, dto.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: any,
  ) {
    return this.passwordResetService.changePassword(
      req.user.userId,
      dto.current_password,
      dto.new_password,
    );
  }

  @Get('login-history')
  @UseGuards(JwtAuthGuard)
  async getLoginHistory(@Request() req: any) {
    return this.rateLimitService.getLoginHistory(req.user.username, 20);
  }
}
