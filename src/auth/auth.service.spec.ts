import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const findFirst = jest.fn();
  const signAsync = jest.fn();

  const testUser = {
    id: 'user-1',
    email: 'admin@test.local',
    passwordHash: bcrypt.hashSync('Test1234!', 10),
    role: 'admin',
    driverId: null,
    carrierId: null,
    isActive: true,
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findFirst } } },
        { provide: JwtService, useValue: { signAsync } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('logs in with valid credentials and returns a token with scoping fields', async () => {
    findFirst.mockResolvedValue(testUser);
    signAsync.mockResolvedValue('signed-jwt');

    const result = await service.login({
      email: 'admin@test.local',
      password: 'Test1234!',
    });

    expect(result.accessToken).toBe('signed-jwt');
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'admin@test.local',
      role: 'admin',
    });
    expect(signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@test.local',
      role: 'admin',
      driverId: null,
      carrierId: null,
    });
    // Soft-deleted and deactivated users must never authenticate.
    expect(findFirst).toHaveBeenCalledWith({
      where: { email: 'admin@test.local', deletedAt: null, isActive: true },
    });
  });

  it('rejects a wrong password', async () => {
    findFirst.mockResolvedValue(testUser);
    await expect(
      service.login({ email: 'admin@test.local', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unknown email', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@test.local', password: 'Test1234!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
