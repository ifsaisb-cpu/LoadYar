import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Request() req: any,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.login(dto, ipAddress);
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
}
