# LoadYar API - Phase 3 Backend

Professional multi-tenant Transportation Management System API built with NestJS + PostgreSQL.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- npm or yarn

### Installation

1. **Clone & Install**
```bash
cd backend
npm install
```

2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

3. **Start PostgreSQL (Docker)**
```bash
docker-compose up -d
```

4. **Run Migrations**
```bash
npm run migration:run
```

5. **Seed Test Data**
```bash
npm run seed:run
```

6. **Start API**
```bash
npm run start:dev
```

API runs on http://localhost:3001

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                      # Entry point
│   ├── app.module.ts                # Root module
│   ├── app.controller.ts            # Root controller
│   ├── app.service.ts               # Root service
│   ├── entities/                    # TypeORM entities
│   │   ├── tenant.entity.ts
│   │   ├── user.entity.ts
│   │   ├── session.entity.ts
│   │   ├── customer.entity.ts
│   │   ├── trip.entity.ts
│   │   ├── booking.entity.ts
│   │   ├── invoice.entity.ts
│   │   └── index.ts
│   ├── modules/
│   │   ├── auth/                    # Authentication (JWT + bcrypt)
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   │   └── login.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── users/                   # User management (stub)
│   │   ├── tenants/                 # Tenant management (stub)
│   │   ├── customers/               # Customer CRUD (stub)
│   │   ├── bookings/                # Booking operations (stub)
│   │   ├── trips/                   # Trip management (stub)
│   │   ├── invoices/                # Invoice handling (stub)
│   │   ├── audit/                   # Audit logging (stub)
│   │   ├── carriers/                # Carrier management (stub)
│   │   ├── drivers/                 # Driver management (stub)
│   │   └── vendors/                 # Vendor management (stub)
│   ├── common/
│   │   ├── interceptors/
│   │   │   └── tenant.interceptor.ts # Auto-tenant injection
│   │   └── guards/
│   │       └── permission.guard.ts   # (TODO: Implement)
│   └── database/
│       ├── schema.sql               # PostgreSQL schema
│       ├── migrations/              # TypeORM migrations (auto-generated)
│       └── seeds/                   # Seed data
├── dist/                            # Compiled output
├── package.json
├── package-lock.json
├── tsconfig.json
├── docker-compose.yml               # PostgreSQL + pgAdmin
├── .env.example
└── README.md
```

---

## 🔐 Authentication Flow

### 1. Login Endpoint
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "ali",
  "password": "password123",
  "tenant_id": 1
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Ali",
    "username": "ali",
    "role": "admin",
    "tenant_id": 1
  },
  "tenant": {
    "id": 1,
    "name": "United Transport Network",
    "slug": "united-transport"
  }
}
```

### 2. Use Token in Requests
```bash
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 3. Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📊 Database Schema

### Core Tables
- **tenants** — Multi-tenant companies
- **users** — Users with role-based access
- **sessions** — Active user sessions
- **customers** — Shipping customers
- **trips** — Transportation jobs (bilty)
- **bookings** — Pre-trip reservations
- **invoices** — Customer billing
- **carriers** — Transport contractors
- **drivers** — Vehicle operators
- **vendors** — Service providers
- **chart_of_accounts** — GL accounting
- **journal_entries** — Double-entry bookkeeping

### Audit Tables
- **audit_log** — All record changes
- **user_login_history** — Login attempts

All tables include: `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete)

---

## 🛡️ Multi-Tenant Architecture

### Row-Level Scoping
Every query automatically filters by `tenant_id`:

```typescript
// TenantInterceptor extracts tenant_id from JWT
// All services receive tenant_id in request context

// Service layer (example)
async getTrips(tenantId: number) {
  return this.tripsRepository.find({
    where: { tenant_id: tenantId },
  });
}
```

### Super Admin Access
- Super admin users have `tenant_id = null` in database
- Can access all tenants
- Must select a workspace on login

### Permission Matrix
- **admin** — Full access (tenant scope)
- **dispatcher** — Trips, expenses (no settings)
- **driver** — Own trips only (row-level FK)
- **carrier** — Read-only portal

---

## 🚀 API Endpoints (Phase 3 Week 1)

### Authentication
- `POST /api/v1/auth/login` — User login
- `POST /api/v1/auth/logout` — User logout
- `GET /api/v1/auth/me` — Current user info
- `GET /api/v1/auth/tenants` — Available workspaces

### (Coming soon in Week 2+)
- Users CRUD
- Customers CRUD
- Trips CRUD
- Invoices CRUD
- Financial reports
- Audit logs

---

## 🔨 Development

### Run in Watch Mode
```bash
npm run start:dev
```

### Build for Production
```bash
npm run build
npm run start:prod
```

### Run Tests
```bash
npm test
npm run test:cov
```

### Linting
```bash
npm run lint
npm run lint:fix
```

---

## 📝 TypeORM Migrations

### Generate Migration (after entity changes)
```bash
npm run migration:generate -- src/database/migrations/AddNewColumn
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

---

## 🐳 Docker

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f postgres
```

### Access pgAdmin
- URL: http://localhost:5050
- Email: admin@loadyar.local
- Password: admin

---

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | dev/prod mode | development |
| PORT | API port | 3001 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USERNAME | DB user | loadyar |
| DB_PASSWORD | DB password | loadyar |
| DB_NAME | Database name | loadyar_db |
| JWT_SECRET | JWT signing key | (change required) |
| CORS_ORIGIN | Frontend URL | localhost:3000 |
| SESSION_TIMEOUT_MINUTES | Inactivity logout | 30 |

---

## 🤝 Contributing

This is Phase 3 of LoadYar. See PHASE_3_ROADMAP.md for current priorities.

---

## 📄 License

MIT - Open Source Transportation Management System for Pakistan

---

**Status:** Week 1 Complete — Auth module ready  
**Next:** Week 2 — User CRUD endpoints  
**Deployed:** (Docker ready for cloud deployment)
