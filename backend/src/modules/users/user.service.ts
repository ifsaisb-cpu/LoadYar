import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

export class CreateUserDto {
  name: string;
  username: string;
  role: string; // admin, dispatcher, driver, carrier
  auth_mode: string; // click or password
  password?: string;
  driver_id?: number;
  carrier_id?: number;
}

export class UpdateUserDto {
  name?: string;
  role?: string;
  auth_mode?: string;
  password?: string;
  status?: string;
  driver_id?: number;
  carrier_id?: number;
}

export class UserResponseDto {
  id: number;
  name: string;
  username: string;
  role: string;
  auth_mode: string;
  driver_id?: number;
  carrier_id?: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(
    dto: CreateUserDto,
    tenantId: number,
    createdBy: string,
  ): Promise<UserResponseDto> {
    // Validate required fields
    if (!dto.name || !dto.username || !dto.role || !dto.auth_mode) {
      throw new BadRequestException('Missing required fields');
    }

    // Validate role enum
    const validRoles = ['admin', 'dispatcher', 'driver', 'carrier'];
    if (!validRoles.includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }

    // Validate auth_mode enum
    if (!['click', 'password'].includes(dto.auth_mode)) {
      throw new BadRequestException('Invalid auth_mode');
    }

    // Check if password required when auth_mode='password'
    if (dto.auth_mode === 'password' && !dto.password) {
      throw new BadRequestException(
        'Password required when auth_mode is "password"',
      );
    }

    // Check password strength when provided
    if (dto.password && dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Check username uniqueness per tenant
    const existing = await this.usersRepository.findOne({
      where: {
        tenant_id: tenantId,
        username: dto.username,
        deleted_at: IsNull(),
      },
    });

    if (existing) {
      throw new ConflictException(
        'Username already exists in this tenant',
      );
    }

    // Create user object
    const user = new User();
    user.tenant_id = tenantId;
    user.name = dto.name;
    user.username = dto.username;
    user.role = dto.role;
    user.auth_mode = dto.auth_mode;
    user.status = 'active';
    user.driver_id = dto.driver_id || null;
    user.carrier_id = dto.carrier_id || null;
    user.created_by = createdBy;
    user.updated_by = createdBy;

    // Hash password if provided
    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(dto.password, salt);
    }

    const savedUser = await this.usersRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async getUsers(tenantId: number): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      where: {
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return users.map((u) => this.toResponseDto(u));
  }

  async getUserById(
    id: number,
    tenantId: number,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async updateUser(
    id: number,
    dto: UpdateUserDto,
    tenantId: number,
    updatedBy: string,
  ): Promise<UserResponseDto> {
    // Find user in tenant
    const user = await this.usersRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update allowed fields
    if (dto.name) user.name = dto.name;
    if (dto.role) {
      const validRoles = ['admin', 'dispatcher', 'driver', 'carrier'];
      if (!validRoles.includes(dto.role)) {
        throw new BadRequestException('Invalid role');
      }
      user.role = dto.role;
    }
    if (dto.auth_mode) {
      if (!['click', 'password'].includes(dto.auth_mode)) {
        throw new BadRequestException('Invalid auth_mode');
      }
      user.auth_mode = dto.auth_mode;
    }
    if (dto.status) user.status = dto.status;
    if (dto.driver_id !== undefined) user.driver_id = dto.driver_id;
    if (dto.carrier_id !== undefined) user.carrier_id = dto.carrier_id;

    // Handle password update
    if (dto.password) {
      if (dto.password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters');
      }
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(dto.password, salt);
    }

    user.updated_by = updatedBy;
    user.updated_at = new Date();

    const savedUser = await this.usersRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async deleteUser(id: number, tenantId: number): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    user.deleted_at = new Date();
    await this.usersRepository.save(user);

    return { message: 'User deleted successfully' };
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      auth_mode: user.auth_mode,
      driver_id: user.driver_id,
      carrier_id: user.carrier_id,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
    };
  }
}
