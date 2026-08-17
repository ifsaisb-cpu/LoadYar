import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Accounting - GL & Journal Entries (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GL Chart of Accounts', () => {
    it('should return standard chart of accounts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gl-accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Should have system accounts
      const accounts = res.body;
      expect(accounts.some((a: any) => a.type === 'Asset')).toBe(true);
      expect(accounts.some((a: any) => a.type === 'Revenue')).toBe(true);
      expect(accounts.some((a: any) => a.type === 'Expense')).toBe(true);
      expect(accounts.some((a: any) => a.type === 'Suspense')).toBe(true);
    });

    it('should get account by ID', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/gl-accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      const accountId = listRes.body[0].id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/gl-accounts/${accountId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(accountId);
    });

    it('should get account by code', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gl-accounts/code/1001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe('1001');
      expect(res.body.name).toBe('Bank Account');
      expect(res.body.type).toBe('Asset');
    });

    it('should return 404 for non-existent account code', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gl-accounts/code/9999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should get account balance', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/gl-accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      const accountId = listRes.body[0].id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/gl-accounts/${accountId}/balance`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.account).toBeDefined();
      expect(res.body.balance).toBeDefined();
      expect(typeof res.body.balance).toBe('number');
    });
  });

  describe('Journal Entries - Double-Entry Accounting', () => {
    it('should create balanced journal entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entry_date: new Date().toISOString(),
          description: 'Purchase of fuel',
          reference_type: 'expense',
          reference_id: 101,
          lines: [
            { account_id: 6, debit_paisa: 50000 }, // Fuel (Debit)
            { account_id: 1, credit_paisa: 50000 }, // Bank (Credit)
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.is_balanced).toBe(true);
      expect(res.body.description).toBe('Purchase of fuel');
    });

    it('should reject unbalanced journal entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entry_date: new Date().toISOString(),
          description: 'Unbalanced entry',
          lines: [
            { account_id: 6, debit_paisa: 100000 }, // Debit 100
            { account_id: 1, credit_paisa: 50000 }, // Credit only 50
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not balanced');
    });

    it('should reject line with both debit and credit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entry_date: new Date().toISOString(),
          description: 'Invalid entry',
          lines: [
            {
              account_id: 6,
              debit_paisa: 50000,
              credit_paisa: 25000, // Both debit and credit
            },
            { account_id: 1, credit_paisa: 50000 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot have both debit and credit');
    });

    it('should reject line with zero amount', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entry_date: new Date().toISOString(),
          description: 'Zero entry',
          lines: [
            { account_id: 6, debit_paisa: 0 }, // Zero debit
            { account_id: 1, credit_paisa: 0 }, // Zero credit
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must have either a debit or credit');
    });

    it('should list journal entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/journal-entries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get entries by reference', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/journal-entries/reference/expense/101')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Accounting Workflows', () => {
    it('should post expense to GL with debit/credit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries/expense')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expense_type: 'fuel',
          amount_paisa: 100000,
          expense_id: 201,
        });

      expect(res.status).toBe(201);
      expect(res.body.is_balanced).toBe(true);
      expect(res.body.lines.length).toBe(2);

      // Should debit Fuel (account 4), credit Bank (account 1)
      const debitLine = res.body.lines.find((l: any) => l.debit_paisa);
      const creditLine = res.body.lines.find((l: any) => l.credit_paisa);

      expect(debitLine.account_id).toBe(4); // Fuel
      expect(creditLine.account_id).toBe(1); // Bank
      expect(debitLine.debit_paisa).toBe(100000);
      expect(creditLine.credit_paisa).toBe(100000);
    });

    it('should post toll/tax expense to GL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries/expense')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expense_type: 'toll_tax',
          amount_paisa: 50000,
          expense_id: 202,
        });

      expect(res.status).toBe(201);
      expect(res.body.is_balanced).toBe(true);
    });

    it('should post driver salary advance to GL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries/expense')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expense_type: 'driver_advance',
          amount_paisa: 250000,
          expense_id: 203,
        });

      expect(res.status).toBe(201);
      expect(res.body.is_balanced).toBe(true);
    });

    it('should post trip revenue to GL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trip_id: 1,
          amount_paisa: 1000000,
        });

      expect(res.status).toBe(201);
      expect(res.body.is_balanced).toBe(true);

      // Should debit Bank, credit Freight Revenue
      const debitLine = res.body.lines.find((l: any) => l.debit_paisa);
      const creditLine = res.body.lines.find((l: any) => l.credit_paisa);

      expect(debitLine.account_id).toBe(1); // Bank
      expect(creditLine.account_id).toBe(3); // Freight Revenue
    });

    it('should post payment to GL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/journal-entries/payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          payment_type: 'carrier_payment',
          amount_paisa: 500000,
          payment_id: 301,
        });

      expect(res.status).toBe(201);
      expect(res.body.is_balanced).toBe(true);

      // Should debit A/P, credit Bank
      const debitLine = res.body.lines.find((l: any) => l.debit_paisa);
      const creditLine = res.body.lines.find((l: any) => l.credit_paisa);

      expect(debitLine.account_id).toBe(2); // A/P
      expect(creditLine.account_id).toBe(1); // Bank
    });
  });

  describe('Permission & Authorization', () => {
    it('should require admin to create journal entries', async () => {
      const dispatcherRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'Dispatcher Karachi',
          password: 'KPipri@2026',
          tenant_id: 1,
        });

      const dispatcherToken = dispatcherRes.body.access_token;

      // Dispatcher can view GL accounts
      const viewRes = await request(app.getHttpServer())
        .get('/api/v1/gl-accounts')
        .set('Authorization', `Bearer ${dispatcherToken}`);

      expect(viewRes.status).toBe(200);

      // But cannot post expense entries (admin only)
      const postRes = await request(app.getHttpServer())
        .post('/api/v1/journal-entries/expense')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({
          expense_type: 'fuel',
          amount_paisa: 100000,
          expense_id: 999,
        });

      expect(postRes.status).toBe(403);
    });
  });
});
