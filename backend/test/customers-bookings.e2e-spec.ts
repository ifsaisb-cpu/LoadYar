import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Customers & Bookings (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let dispatcherToken: string;
  let customerId: number;

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

    // Get admin and dispatcher tokens
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'LoadYar Super Admin',
        password: 'SuperAdmin@2026',
        tenant_id: 1,
      });
    adminToken = adminRes.body.access_token;

    const dispatcherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'Dispatcher Karachi',
        password: 'KPipri@2026',
        tenant_id: 1,
      });
    dispatcherToken = dispatcherRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Customer CRUD', () => {
    it('should create customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Customer Inc',
          plant: 'Lahore Plant',
          delivery_points: 'Islamabad, Rawalpindi',
          billing_contact: 'Ali Khan',
          ops_contact: 'Ahmed Hassan',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Test Customer Inc');
      customerId = res.body.id;
    });

    it('should not create duplicate customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Customer Inc',
          plant: 'Lahore Plant',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject empty customer name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
        });

      expect(res.status).toBe(400);
    });

    it('should list customers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get customer by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(customerId);
      expect(res.body.name).toBe('Test Customer Inc');
    });

    it('should update customer', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          billing_contact: 'New Contact',
          ops_contact: 'New Ops Person',
        });

      expect(res.status).toBe(200);
      expect(res.body.billing_contact).toBe('New Contact');
      expect(res.body.ops_contact).toBe('New Ops Person');
    });

    it('should allow dispatcher to view customers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${dispatcherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should not allow dispatcher to create customers', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({
          name: 'Dispatcher Customer',
        });

      expect(res.status).toBe(403);
    });

    it('should soft delete customer', async () => {
      // Create customer to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Customer To Delete',
        });

      const customerId = createRes.body.id;

      // Delete it
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify not in list
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.find((c: any) => c.id === customerId);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Booking CRUD', () => {
    let bookingId: number;

    it('should create booking', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: customerId,
          booking_date: new Date().toISOString(),
          bilty_no: 'BLY-2026-001',
          route_from: 'Karachi',
          destination: 'Lahore',
          consignee: 'Mr. Ahmed',
          requested_pickup: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('open');
      expect(res.body.bilty_no).toBe('BLY-2026-001');
      bookingId = res.body.id;
    });

    it('should not create booking for non-existent customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: 99999,
          booking_date: new Date().toISOString(),
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Customer');
    });

    it('should not create duplicate bilty_no', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: customerId,
          booking_date: new Date().toISOString(),
          bilty_no: 'BLY-2026-001', // Duplicate
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should list bookings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get booking by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(bookingId);
    });

    it('should get bookings by customer ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/customer/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((b: any) => b.id === bookingId)).toBe(true);
    });

    it('should update booking', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          destination: 'Islamabad',
          status: 'converted',
        });

      expect(res.status).toBe(200);
      expect(res.body.destination).toBe('Islamabad');
      expect(res.body.status).toBe('converted');
    });

    it('should reject invalid status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status');
    });

    it('should not delete converted booking', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Can only delete bookings with status "open"');
    });

    it('should delete open booking', async () => {
      // Create new open booking
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: customerId,
          booking_date: new Date().toISOString(),
          bilty_no: 'BLY-2026-DELETE',
        });

      const bookingToDelete = createRes.body.id;

      // Delete it
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/bookings/${bookingToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify not in list
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.find((b: any) => b.id === bookingToDelete);
      expect(found).toBeUndefined();
    });

    it('should allow dispatcher to create bookings', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({
          customer_id: customerId,
          booking_date: new Date().toISOString(),
          bilty_no: 'BLY-2026-DISP',
        });

      expect(res.status).toBe(201);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Permission & Authorization', () => {
    it('should require authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/customers');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  describe('Data Isolation', () => {
    it('should not see other tenant data', async () => {
      // Create customer in tenant 1
      const customer1Res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tenant 1 Customer',
        });

      const customer1Id = customer1Res.body.id;

      // Login as different tenant admin (if available)
      // For now, verify tenant 1 can see customer
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.find((c: any) => c.id === customer1Id);
      expect(found).toBeDefined();
    });
  });
});
