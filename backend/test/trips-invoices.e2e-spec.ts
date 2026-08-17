import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Trips & Invoices (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let customerId: number;
  let tripId: number;

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

    // Get admin token
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'LoadYar Super Admin',
        password: 'SuperAdmin@2026',
        tenant_id: 1,
      });
    adminToken = adminRes.body.access_token;

    // Create test customer
    const customerRes = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Trip Test Customer',
        plant: 'Test Plant',
      });
    customerId = customerRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Trip CRUD', () => {
    it('should create trip', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bilty_no: 'BLY-TRP-001',
          customer_id: customerId,
          date: new Date().toISOString(),
          consignee: 'Test Consignee',
          route: 'Karachi to Lahore',
          freight_paisa: 500000,
          veh_make: 'Hino',
          veh_type: 'Cargo',
          veh_reg: 'ABC-123',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('booked');
      expect(res.body.bilty_no).toBe('BLY-TRP-001');
      tripId = res.body.id;
    });

    it('should not create trip for non-existent customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bilty_no: 'BLY-TRP-FAIL',
          customer_id: 99999,
          date: new Date().toISOString(),
          consignee: 'Test',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Customer');
    });

    it('should not create duplicate bilty_no', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bilty_no: 'BLY-TRP-001', // Duplicate
          customer_id: customerId,
          date: new Date().toISOString(),
          consignee: 'Test',
        });

      expect(res.status).toBe(409);
    });

    it('should list trips', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get trip by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/trips/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tripId);
    });

    it('should get trips by customer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/trips/customer/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((t: any) => t.id === tripId)).toBe(true);
    });

    it('should get trips by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/trips/status/booked')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should update trip status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'in_transit',
          freight_paisa: 550000,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_transit');
      expect(res.body.freight_paisa).toBe(550000);
    });

    it('should reject invalid trip status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(res.status).toBe(400);
    });

    it('should mark trip as delivered', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'delivered',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');
    });

    it('should update trip pay_status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pay_status: 'to_pay',
        });

      expect(res.status).toBe(200);
      expect(res.body.pay_status).toBe('to_pay');
    });

    it('should return 404 for non-existent trip', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/trips/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Invoice CRUD', () => {
    let invoiceId: number;

    it('should create invoice from trip', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: tripId,
          customer_id: customerId,
          invoice_number: 'INV-2026-001',
          amount_paisa: 550000,
          tax_label: 'SRB',
          tax_paisa: 55000,
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('unpaid');
      expect(res.body.total_paisa).toBe(605000); // amount + tax
      invoiceId = res.body.id;
    });

    it('should not create invoice for non-existent trip', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: 99999,
          customer_id: customerId,
          invoice_number: 'INV-FAIL',
          amount_paisa: 500000,
          invoice_date: new Date().toISOString(),
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Trip');
    });

    it('should not create invoice for non-existent customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: tripId,
          customer_id: 99999,
          invoice_number: 'INV-FAIL',
          amount_paisa: 500000,
          invoice_date: new Date().toISOString(),
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Customer');
    });

    it('should not create duplicate invoice number', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: tripId,
          customer_id: customerId,
          invoice_number: 'INV-2026-001', // Duplicate
          amount_paisa: 500000,
          invoice_date: new Date().toISOString(),
        });

      expect(res.status).toBe(409);
    });

    it('should reject zero amount', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: tripId,
          customer_id: customerId,
          invoice_number: 'INV-2026-BAD',
          amount_paisa: 0,
          invoice_date: new Date().toISOString(),
        });

      expect(res.status).toBe(400);
    });

    it('should list invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get invoice by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(invoiceId);
    });

    it('should get invoices by customer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/invoices/customer/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get invoices by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/invoices/status/unpaid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get invoices by trip', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/invoices/trip/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should update invoice status to partial', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'partial',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('partial');
    });

    it('should update invoice status to paid', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'paid',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('paid');
    });

    it('should reject invalid invoice status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/invoices/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Trip-Invoice Workflow', () => {
    it('should create trip and generate invoice', async () => {
      // Create trip
      const tripRes = await request(app.getHttpServer())
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bilty_no: 'BLY-WF-001',
          customer_id: customerId,
          date: new Date().toISOString(),
          consignee: 'Workflow Test',
          freight_paisa: 1000000,
        });

      const workflowTripId = tripRes.body.id;

      // Generate invoice from trip
      const invRes = await request(app.getHttpServer())
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: workflowTripId,
          customer_id: customerId,
          invoice_number: 'INV-WF-001',
          amount_paisa: 1000000,
          invoice_date: new Date().toISOString(),
        });

      expect(invRes.status).toBe(201);
      expect(invRes.body.trip_id).toBe(workflowTripId);

      // Update trip status
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/trips/${workflowTripId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'delivered',
          pay_status: 'to_be_billed',
        });

      expect(updateRes.status).toBe(200);

      // Mark invoice as paid
      const paidRes = await request(app.getHttpServer())
        .patch(`/api/v1/invoices/${invRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'paid',
        });

      expect(paidRes.status).toBe(200);
      expect(paidRes.body.status).toBe('paid');
    });
  });
});
