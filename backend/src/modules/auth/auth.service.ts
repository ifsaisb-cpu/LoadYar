import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/tenant.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    try {
      const user = await this.userRepo.findOne({
        where: { email },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role,
      });

      return { token, user: { id: user.id, email: user.email, role: user.role } };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  async validateUser(payload: any) {
    return this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['tenant'],
    });
  }
}
