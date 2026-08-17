import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Session } from '../../entities/session.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    // Find user by username
    const user = await this.usersRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Verify password if user has auth_mode='password'
    if (user.auth_mode === 'password') {
      if (!dto.password) {
        throw new UnauthorizedException('Password required');
      }
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid username or password');
      }
    }

    // Verify tenant if specified
    let tenant: Tenant;
    if (dto.tenant_id) {
      tenant = await this.tenantsRepository.findOne({
        where: { id: dto.tenant_id },
      });
      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }
      // Verify user has access to this tenant
      if (user.tenant_id !== null && user.tenant_id !== dto.tenant_id) {
        throw new UnauthorizedException(
          'User does not have access to this tenant',
        );
      }
    } else if (user.tenant_id) {
      // User can only access their assigned tenant
      tenant = await this.tenantsRepository.findOne({
        where: { id: user.tenant_id },
      });
    } else {
      // Super admin - return first available tenant or error
      const tenants = await this.tenantsRepository.find({
        where: { status: 'active' },
      });
      if (!tenants.length) {
        throw new UnauthorizedException('No tenants available');
      }
      tenant = tenants[0];
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      tenant_id: tenant.id,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.sessionsRepository.save({
      user_id: user.id,
      tenant_id: tenant.id,
      session_token: access_token,
      refresh_token: refresh_token,
      ip_address: ipAddress,
      expires_at: expiresAt,
      is_active: true,
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenant_id: tenant.id,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  async logout(userId: number, sessionToken: string): Promise<void> {
    await this.sessionsRepository.update(
      {
        user_id: userId,
        session_token: sessionToken,
      },
      { is_active: false },
    );
  }

  async validateJwt(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getAvailableTenants(
    userId: number,
  ): Promise<{ id: number; name: string; slug: string }[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.tenant_id !== null) {
      // Regular user - only their tenant
      const tenant = await this.tenantsRepository.findOne({
        where: { id: user.tenant_id },
      });
      return tenant ? [tenant] : [];
    } else {
      // Super admin - all active tenants
      return await this.tenantsRepository.find({
        where: { status: 'active' },
        select: ['id', 'name', 'slug'],
      });
    }
  }
}
