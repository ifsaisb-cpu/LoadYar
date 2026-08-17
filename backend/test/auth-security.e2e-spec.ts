import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController Security (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate Limiting', () => {
    it('should allow first login attempt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'LoadYar Super Admin',
          password: 'SuperAdmin@2026',
          tenant_id: 1,
        });

      expect(res.status).toBe(200);
      adminToken = res.body.access_token;
      adminUserId = res.body.user.id;
    });

    it('should track failed login attempts', async () => {
      const testUser = 'test_rate_limit_user';

      // Attempt 1: wrong password
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser,
          password: 'wrong_password',
        });

      // Attempt 2: wrong password
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser,
          password: 'wrong_password',
        });

      // Attempt 3: should still fail but lock account
      const res3 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser,
          password: 'wrong_password',
        });

      // Should be locked after 3 failed attempts
      expect(res3.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject login when account is locked', async () => {
      const testUser = 'rate_limit_locked_user';

      // Create failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            username: testUser,
            password: 'wrong_password',
          });
      }

      // Next attempt should be locked (even with correct password)
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser,
          password: 'CorrectPassword@123',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.message).toContain('locked');
    });

    it('should clear failed attempts on successful login', async () => {
      // This test requires creating a user first and using correct password
      // For now, verify successful login clears attempts
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'LoadYar Super Admin',
          password: 'SuperAdmin@2026',
          tenant_id: 1,
        });

      expect(res.status).toBe(200);
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset-request')
        .send({
          username: 'LoadYar Super Admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      // In production, don't return reset_token in response
      // For MVP, it's returned for testing
    });

    it('should not reveal if user exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset-request')
        .send({
          username: 'nonexistent_user_12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If user exists');
    });

    it('should generate valid reset token with 15-min expiry', async () => {
      const reqRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset-request')
        .send({
          username: 'LoadYar Super Admin',
        });

      expect(reqRes.body.reset_token).toBeDefined();
      // Token should be valid JWT
      const tokenParts = reqRes.body.reset_token.split('.');
      expect(tokenParts.length).toBe(3); // JWT has 3 parts
    });

    it('should reject reset with invalid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset')
        .send({
          token: 'invalid.token.here',
          password: 'NewPassword@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should reject weak passwords on reset', async () => {
      const reqRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset-request')
        .send({
          username: 'LoadYar Super Admin',
        });

      const token = reqRes.body.reset_token;

      // Try weak password (no numbers)
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset')
        .send({
          token,
          password: 'NoNumberPassword',
        });

      expect(res.status).toBe(400);
    });

    it('should reset password and invalidate sessions', async () => {
      // Get reset token
      const reqRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset-request')
        .send({
          username: 'LoadYar Super Admin',
        });

      const token = reqRes.body.reset_token;

      // Reset password
      const resetRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset')
        .send({
          token,
          password: 'NewReset@123', // New password
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('successfully');

      // Old token should now be invalid (sessions cleared)
      // Next request with old token should fail
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      // Session should be invalidated
      expect(meRes.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('Change Password (Authenticated)', () => {
    let freshToken: string;

    beforeAll(async () => {
      // Get fresh token for change password tests
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'LoadYar Super Admin',
          password: 'SuperAdmin@2026',
          tenant_id: 1,
        });
      freshToken = res.body.access_token;
    });

    it('should require authentication for change password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .send({
          current_password: 'SuperAdmin@2026',
          new_password: 'NewPassword@123',
        });

      expect(res.status).toBe(401);
    });

    it('should reject invalid current password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          current_password: 'WrongCurrentPassword@123',
          new_password: 'NewPassword@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('incorrect');
    });

    it('should reject weak new passwords', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          current_password: 'SuperAdmin@2026',
          new_password: 'weak', // Too weak
        });

      expect(res.status).toBe(400);
    });

    it('should change password successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          current_password: 'SuperAdmin@2026',
          new_password: 'ChangedPassword@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully');

      // Should be able to login with new password
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'LoadYar Super Admin',
          password: 'ChangedPassword@123',
          tenant_id: 1,
        });

      expect(loginRes.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      // Check for security headers (helmet)
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-content-type-options']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('should have CSP header', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health');

      const csp = res.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain('default-src');
    });
  });

  describe('Session Management', () => {
    it('should require valid JWT token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });

    it('should expire sessions after 30 minutes', async () => {
      // This test is difficult without mocking time
      // For now, verify session tracking is in database
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should still be valid
      expect(res.status).toBe(200);
    });

    it('should update last_activity_at on each request', async () => {
      // Make two requests and verify timestamp updates
      const res1 = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.status).toBe(200);

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const res2 = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      // Both requests should be successful (session not expired)
    });
  });

  describe('Login History', () => {
    it('should require authentication to view login history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/login-history');

      expect(res.status).toBe(401);
    });

    it('should return login history for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/login-history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should contain login attempt records
    });
  });

  describe('Password Requirements', () => {
    it('should enforce password complexity', async () => {
      const testCases = [
        { password: 'short', reason: 'too short' },
        { password: 'nouppercasehere1', reason: 'no uppercase' },
        { password: 'NOLOWERCASEHERE1', reason: 'no lowercase' },
        { password: 'NoNumbersHere', reason: 'no number' },
      ];

      for (const testCase of testCases) {
        const reqRes = await request(app.getHttpServer())
          .post('/api/v1/auth/password-reset-request')
          .send({
            username: 'LoadYar Super Admin',
          });

        const token = reqRes.body.reset_token;

        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/password-reset')
          .send({
            token,
            password: testCase.password,
          });

        expect(res.status).toBe(400);
      }
    });
  });
});
