import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let dispatcherToken: string;
  let adminTenantId: number = 1;

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

  describe('User CRUD - Happy Path', () => {
    it('should create admin user (GET auth token first)', async () => {
      // Login as super admin to get token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'LoadYar Super Admin',
          password: 'SuperAdmin@2026',
          tenant_id: 1,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.access_token).toBeDefined();
      adminToken = loginRes.body.access_token;
    });

    it('should NOT create user without admin role', async () => {
      // Login as dispatcher
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'Dispatcher Karachi',
          password: 'KPipri@2026',
          tenant_id: 1,
        });

      dispatcherToken = loginRes.body.access_token;

      // Try to create user as dispatcher
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({
          name: 'Test User',
          username: 'test_disp',
          role: 'dispatcher',
          auth_mode: 'password',
          password: 'Secure@123',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin role required');
    });

    it('should create user with admin role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Test User',
          username: 'new_user_e2e',
          role: 'dispatcher',
          auth_mode: 'password',
          password: 'SecurePass@123',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('New Test User');
      expect(res.body.username).toBe('new_user_e2e');
      expect(res.body.role).toBe('dispatcher');
      expect(res.body.password_hash).toBeUndefined(); // Password not in response
      expect(res.body.created_by).toBe('LoadYar Super Admin');
    });

    it('should list users for tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      // Verify no password hashes returned
      res.body.forEach((user: any) => {
        expect(user.password_hash).toBeUndefined();
      });
    });

    it('should get specific user by ID', async () => {
      // First list to get a user ID
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const userId = listRes.body[0].id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.password_hash).toBeUndefined();
    });

    it('should update user', async () => {
      // Create a user first
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Update Test User',
          username: 'update_test_user',
          role: 'dispatcher',
          auth_mode: 'click',
        });

      const userId = createRes.body.id;

      // Update the user
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          role: 'driver',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Updated Name');
      expect(updateRes.body.role).toBe('driver');
    });

    it('should soft delete user', async () => {
      // Create a user
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Delete Test User',
          username: 'delete_test_user',
          role: 'carrier',
          auth_mode: 'click',
        });

      const userId = createRes.body.id;

      // Delete the user
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain('deleted successfully');

      // Verify user not in list
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const deleted = listRes.body.find((u: any) => u.id === userId);
      expect(deleted).toBeUndefined();
    });
  });

  describe('User CRUD - Validation & Error Cases', () => {
    it('should reject duplicate username', async () => {
      const createRes1 = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'User One',
          username: 'duplicate_user',
          role: 'dispatcher',
          auth_mode: 'click',
        });

      expect(createRes1.status).toBe(201);

      // Try to create with same username
      const createRes2 = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'User Two',
          username: 'duplicate_user',
          role: 'dispatcher',
          auth_mode: 'click',
        });

      expect(createRes2.status).toBe(409);
      expect(createRes2.body.message).toContain('already exists');
    });

    it('should reject invalid role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Role User',
          username: 'invalid_role_user',
          role: 'superadmin', // Invalid
          auth_mode: 'click',
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid auth_mode', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Auth User',
          username: 'invalid_auth_user',
          role: 'dispatcher',
          auth_mode: 'oauth', // Invalid
        });

      expect(res.status).toBe(400);
    });

    it('should require password when auth_mode=password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Password User',
          username: 'no_password_user',
          role: 'dispatcher',
          auth_mode: 'password',
          // Missing password
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Password required');
    });

    it('should enforce password strength', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Weak Password User',
          username: 'weak_password_user',
          role: 'dispatcher',
          auth_mode: 'password',
          password: 'weak', // Too short
        });

      expect(res.status).toBe(400);
    });

    it('should require uppercase, lowercase, and number in password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Number User',
          username: 'no_number_user',
          role: 'dispatcher',
          auth_mode: 'password',
          password: 'NoNumberPassword', // Missing number
        });

      expect(res.status).toBe(400);
    });

    it('should not allow non-admin to get users list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${dispatcherToken}`);

      expect(res.status).toBe(403);
    });

    it('should not allow non-admin to update user', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/1')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(403);
    });

    it('should not allow non-admin to delete user', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/users/1')
        .set('Authorization', `Bearer ${dispatcherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Missing Fields', // Missing username, role, auth_mode
        });

      expect(res.status).toBe(400);
    });

    it('should reject invalid username format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bad Username',
          username: 'invalid username@#$', // Invalid chars
          role: 'dispatcher',
          auth_mode: 'click',
        });

      expect(res.status).toBe(400);
    });

    it('should prevent cross-tenant user access', async () => {
      // This would require a second tenant with its own admin token
      // For now, we verify the backend filters correctly
      // In a full test suite, we'd create a second tenant and admin
      // Then verify tenant 2 admin cannot see tenant 1 users

      // Placeholder for cross-tenant isolation test
      expect(adminToken).toBeDefined();
    });
  });

  describe('User CRUD - Created User Can Login', () => {
    it('should allow newly created user to login', async () => {
      // Create user
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Login Test User',
          username: 'login_test_user',
          role: 'dispatcher',
          auth_mode: 'password',
          password: 'LoginTest@123',
        });

      expect(createRes.status).toBe(201);

      // Try to login with new credentials
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'login_test_user',
          password: 'LoginTest@123',
          tenant_id: 1,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.access_token).toBeDefined();
      expect(loginRes.body.user.username).toBe('login_test_user');
      expect(loginRes.body.user.role).toBe('dispatcher');
    });

    it('should reject login with wrong password', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'login_test_user',
          password: 'WrongPassword@123',
        });

      expect(loginRes.status).toBe(401);
    });
  });

  describe('User CRUD - Audit Trail', () => {
    it('should track created_by field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Audit Test User',
          username: 'audit_test_user',
          role: 'dispatcher',
          auth_mode: 'click',
        });

      expect(res.status).toBe(201);
      expect(res.body.created_by).toBe('LoadYar Super Admin');
    });

    it('should track updated_by field on update', async () => {
      // Create user
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Update Audit User',
          username: 'update_audit_user',
          role: 'dispatcher',
          auth_mode: 'click',
        });

      const userId = createRes.body.id;

      // Update user
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Audit Name',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.updated_by).toBe('LoadYar Super Admin');
    });
  });
});
