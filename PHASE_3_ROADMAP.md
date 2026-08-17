# Phase 3 Roadmap: Backend Migration & Mobile App

**Duration:** 8-12 weeks  
**Team:** Backend (1), Frontend (1), Mobile (1), DevOps (1)  
**Status:** Planning  
**Target:** Production-ready SaaS platform

---

## Phase 3 Overview

Transform LoadYar from a single-file SPA with localStorage to a proper multi-tenant SaaS platform with:
- PostgreSQL database with audit logging
- NestJS backend API
- React Native mobile app (Expo)
- Professional security & monitoring
- Scalable infrastructure (Docker, AWS/GCP)

---

## Part 1: Backend Migration (Weeks 1-4)

### 1.1: PostgreSQL Schema Design

**Goal:** Migrate from localStorage JSON to PostgreSQL with proper ACID guarantees

**Key Collections to Migrate:**
```
Tenants → tenants table
Users → users table (with bcrypt passwords)
Customers → customers table
Rate Agreements → rate_agreements table
Carriers → carriers table
Drivers → drivers table
Bookings → bookings table
Trips → trips table (most important)
Invoices → invoices table
GL Accounts → chart_of_accounts table
Journal Entries → journal_entries table (audit trail)
...
[Full schema: see current COLLS array]
```

**Special Tables:**
```
audit_log
├─ id, table_name, record_id
├─ action (CREATE, UPDATE, DELETE)
├─ old_values, new_values (JSON)
├─ changed_by (user_id)
├─ timestamp
└─ tenant_id (data isolation)

sessions
├─ session_id, user_id, tenant_id
├─ created_at, last_activity_at
├─ expires_at (30 min TTL)
├─ ip_address, user_agent
└─ is_active (boolean)

user_login_history
├─ user_id, timestamp
├─ success (boolean)
├─ ip_address, user_agent
├─ failure_reason (if failed)
└─ tenant_id
```

### 1.2: NestJS API Structure

**Modules to Build:**

```
src/
├── auth/
│   ├── auth.controller.ts (POST /auth/login, /auth/logout)
│   ├── auth.service.ts (JWT + bcrypt)
│   ├── jwt.strategy.ts (JWT token validation)
│   └── guards/ (PermissionGuard, TenantGuard)
│
├── tenants/
│   ├── tenants.controller.ts
│   ├── tenants.service.ts
│   ├── tenants.entity.ts
│   └── tenant.interceptor.ts (auto-inject tenant_id)
│
├── users/
│   ├── users.controller.ts (CRUD + password reset)
│   ├── users.service.ts
│   ├── users.entity.ts
│   └── password.service.ts (bcrypt)
│
├── bookings/
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   ├── bookings.entity.ts
│   └── bilty.service.ts (gate pass entry)
│
├── trips/
│   ├── trips.controller.ts
│   ├── trips.service.ts
│   ├── trips.entity.ts
│   └── checklist.service.ts
│
├── invoices/
│   ├── invoices.controller.ts
│   ├── invoices.service.ts
│   └── invoices.entity.ts
│
├── accounting/
│   ├── gl-accounts.controller.ts
│   ├── gl-accounts.service.ts
│   ├── journal-entries.service.ts
│   └── posting.service.ts (debit/credit logic)
│
├── audit/
│   ├── audit.service.ts (log changes)
│   └── audit-log.entity.ts
│
└── common/
    ├── decorators/ (CurrentTenant, CurrentUser)
    ├── pipes/ (validation)
    └── exceptions/ (custom error handling)
```

**API Endpoints (Example):**

```
Authentication:
POST   /auth/login           → {username, password, tenant_id}
POST   /auth/logout          → {}
POST   /auth/refresh-token   → {refresh_token}
POST   /auth/password-reset  → {user_id, new_password}

Users (Admin only):
GET    /tenants/:id/users    → []
POST   /tenants/:id/users    → create user
PUT    /tenants/:id/users/:uid → edit user
DELETE /tenants/:id/users/:uid → soft delete

Bookings:
GET    /tenants/:id/bookings → []
POST   /tenants/:id/bookings → create
PUT    /tenants/:id/bookings/:bid → edit
POST   /tenants/:id/bookings/:bid/bulk-gate-pass → gate pass entry

Trips:
GET    /tenants/:id/trips    → []
POST   /tenants/:id/trips    → create
PUT    /tenants/:id/trips/:tid → edit
POST   /tenants/:id/trips/:tid/expenses → add expense

GL Accounts:
GET    /tenants/:id/gl-accounts → []
POST   /tenants/:id/journal-entries → post entry
GET    /tenants/:id/reports/gl-report → report

Audit:
GET    /tenants/:id/audit-log → [{...}]
```

### 1.3: Frontend Migration

**Strategy:** Minimal API binding layer

```javascript
// BEFORE (localStorage)
const trips = allScoped('trips')

// AFTER (API)
const trips = await fetch(`/api/tenants/${state.tenant.id}/trips`)
  .then(r => r.json())
```

**Changes:**
- Add `api.ts` service with fetch wrapper + error handling
- Replace all `add/upd/del/all/allScoped` calls with API methods
- Add loading states & error handling
- Cache locally for offline capability
- Sync on connectivity

**Data Layer Wrapper:**
```javascript
// Before: db.trips = [{...}]
// After: API call

const api = {
  trips: {
    list: () => fetch(`/api/tenants/${tenant}/trips`).then(r => r.json()),
    create: (data) => fetch(`/api/tenants/${tenant}/trips`, {
      method: 'POST', 
      body: JSON.stringify(data)
    }).then(r => r.json()),
    update: (id, data) => fetch(`/api/tenants/${tenant}/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then(r => r.json()),
    delete: (id) => fetch(`/api/tenants/${tenant}/trips/${id}`, {
      method: 'DELETE'
    })
  }
}

// Usage
const trips = await api.trips.list()
const newTrip = await api.trips.create({...})
```

---

## Part 2: Security Hardening (Weeks 2-3, parallel)

### 2.1: Password Security

```javascript
// BEFORE
password_hash = simpleHash(password)  // Not secure

// AFTER
import * as bcrypt from 'bcrypt'

const hashedPassword = await bcrypt.hash(password, 10)
const isValid = await bcrypt.compare(password, hashedPassword)
```

### 2.2: Session Management

```javascript
// Session Timeout: 30 minutes inactivity
POST /api/auth/login → {access_token, refresh_token, expires_in: 1800}

// Every request checks: last_activity_at
// If > 30 min idle → session expires → redirect to login

// Refresh token (7 days): used to get new access token
POST /api/auth/refresh-token → {access_token}
```

### 2.3: Password Reset Flow

```
1. User clicks "Forgot Password"
2. Enters email/username
3. Server generates reset token (JWT, 1 hour TTL)
4. Sends reset link: /reset-password?token=xxx
5. User sets new password
6. Token invalidated
```

### 2.4: Audit Logging

```javascript
// Every change logged
POST /api/trips (create) →
  audit_log: {
    table: 'trips',
    action: 'CREATE',
    record_id: 123,
    new_values: {bilty_no, customer_id, ...},
    changed_by: user_id,
    tenant_id: 1,
    timestamp: '2026-08-17T...'
  }

// Query audit log
GET /api/audit-log?table=trips&record_id=123
→ [{action: CREATE, by: ali, at: ...}, ...]
```

### 2.5: HTTPS & CSP

```nginx
# Nginx config
server {
  listen 443 ssl http2;
  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;
  
  # Force HTTPS
  add_header Strict-Transport-Security "max-age=31536000" always;
  
  # CSP
  add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'" always;
  
  location /api {
    proxy_pass http://localhost:3000;
  }
  
  location / {
    # Serve React app
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Part 3: Mobile App (Weeks 4-8)

### 3.1: Offline-First Architecture

**Goal:** Driver can work completely offline, sync when online

```
Device Storage:
├── Local SQLite
│   ├── Trips (all downloaded)
│   ├── Checklists (local forms)
│   ├── Expenses (local queue)
│   └── Location history (GPS)
│
└── Sync Queue
    ├── Pending uploads (failed ops)
    └── Timestamps & conflict markers
```

### 3.2: Mobile UI (React Native/Expo)

**Screens:**
```
Login
├─ Username/password
├─ Biometric (optional)
└─ Remember device

Dashboard (Driver)
├─ "My Trips" (from trip_id = driver_id)
├─ Trip cards: [Trip #, Status, Pickup → Delivery, Actions]
└─ [Checklist] [Expenses] [Delivery Sign]

Trip Detail
├─ Cargo details
├─ Current location (map)
├─ Checklist (28 items, local save)
├─ Condition photos (camera integration)
└─ [Start] [Stop] [Mark Delivered]

Checklist (Dynamic)
├─ 28 items: [photo, text, pass/fail/damage]
├─ English + Urdu labels
├─ Auto-save to SQLite
└─ Photos stored locally

Expenses
├─ Quick entry: [Type, Amount, Location, Notes]
├─ Auto-sync on upload to sync queue
└─ Show pending badge when offline

Settings
├─ Account info
├─ Sync status
├─ Cache size
├─ Offline mode toggle
└─ Logout
```

### 3.3: Sync Logic

```javascript
// Every 60 seconds (if online)
if (navigator.onLine) {
  // Pull latest trips/checklists
  const trips = await api.trips.list()
  await localDb.trips.upsert(trips)
  
  // Push pending updates
  const pending = await localDb.syncQueue.getPending()
  for (const item of pending) {
    try {
      await api[item.type].update(item.id, item.data)
      await localDb.syncQueue.markSynced(item.id)
    } catch (err) {
      console.log('Sync failed, will retry later', err)
    }
  }
}
```

### 3.4: Geolocation & Tracking

```javascript
// Background GPS tracking (iOS/Android)
import * as Location from 'expo-location'

const startTracking = async () => {
  const subscription = await Location.watchPositionAsync(
    {accuracy: Location.Accuracy.High, timeInterval: 30000}, // 30s
    location => {
      // Save to local DB
      localDb.locationHistory.add({
        trip_id: currentTrip.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date()
      })
    }
  )
}

// On trip delivery, sync all locations
await syncLocations(currentTrip.id)
```

---

## Part 4: DevOps & Infrastructure (Weeks 3-6, parallel)

### 4.1: Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: loadyar_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    environment:
      DATABASE_URL: postgres://user:pass@postgres:5432/loadyar_prod
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
```

### 4.2: CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: ${{ secrets.DOCKER_REGISTRY }}/loadyar:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          aws ecs update-service --cluster loadyar --service api --force-new-deployment
```

### 4.3: Monitoring & Logging

```javascript
// Sentry for error tracking
import * as Sentry from "@sentry/nestjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

// Application Insights for performance
import { AvailabilityMetric } from 'applicationinsights'
```

---

## Part 5: Enhanced Security (Weeks 5-7)

### 5.1: Two-Factor Authentication (2FA)

```javascript
// Super admin gets 2FA (TOTP-based)
import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'

// Setup 2FA
POST /api/auth/2fa/setup →
  qr_code_url: "data:image/png;base64,..."
  secret: "JBSWY3DPEBLW64TMMQ======"

// Verify 2FA
POST /api/auth/login/verify-2fa {
  otp_code: "123456"
} → access_token
```

### 5.2: Rate Limiting

```javascript
import { ThrottlerModule } from '@nestjs/throttler'

ThrottlerModule.register([
  {
    ttl: 60000,        // 1 minute
    limit: 10,         // 10 requests
  },
  {
    ttl: 3600000,      // 1 hour
    limit: 100,        // 100 requests
  },
])

// Login endpoint: stricter limit
POST /api/auth/login → 5 requests per minute
```

### 5.3: API Key Authentication (for integrations)

```javascript
// Create API key for mobile app
POST /api/admin/api-keys {
  name: "Mobile App v1",
  permissions: ["trips:read", "expenses:write"]
} → api_key: "sk_live_abc123..."

// Use in mobile app
fetch(`/api/trips`, {
  headers: {
    'Authorization': `Bearer sk_live_abc123...`
  }
})
```

---

## Implementation Timeline

### Week 1-2: Database & API
- PostgreSQL schema design & migration
- NestJS bootstrap
- Auth controller (login/logout/refresh)
- User CRUD endpoints

### Week 2-3: Security (parallel)
- Bcrypt password hashing
- JWT token management
- Audit logging
- Session timeout

### Week 3-4: Core API
- Bookings/Trips endpoints
- Invoices & Payments
- GL Accounts & Posting

### Week 4-5: DevOps
- Docker setup
- CI/CD pipeline
- Monitoring & logging
- HTTPS/CSP

### Week 5-8: Mobile App
- React Native project
- Offline storage (SQLite)
- Sync logic
- Geolocation tracking
- Core screens (login, trips, checklist, expenses)

### Week 6-7: Enhanced Security
- 2FA for super admin
- Rate limiting
- API keys
- Security headers

### Week 8-12: Testing & Refinement
- Integration testing
- Load testing
- Mobile app testing (iOS/Android)
- Beta rollout
- Production launch

---

## Success Criteria

✅ All data migrated to PostgreSQL  
✅ API passes 100+ integration tests  
✅ Mobile app runs offline  
✅ 30-minute session timeout enforced  
✅ All user actions audited  
✅ Dashboard loads < 2 seconds  
✅ Mobile app syncs < 5 seconds when online  
✅ 2FA working for super admin  
✅ HTTPS enforced on all endpoints  
✅ Docker deployment automated  
✅ Monitoring & alerts configured  
✅ Backup/restore tested  

---

## Budget Estimate

| Component | Hours | Cost (@$50/hr) |
|-----------|-------|---|
| Backend (API + DB) | 160 | $8,000 |
| Frontend (API binding) | 80 | $4,000 |
| Mobile App | 200 | $10,000 |
| Security & Hardening | 80 | $4,000 |
| DevOps & Deployment | 80 | $4,000 |
| Testing & QA | 120 | $6,000 |
| Documentation | 40 | $2,000 |
| **TOTAL** | **760** | **$38,000** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data migration bugs | Run parallel system 2 weeks; validate counts |
| API performance | Load test with 1M+ records; optimize queries |
| Mobile sync conflicts | Implement operational transform or CRDT |
| Security gaps | Third-party security audit before launch |
| Vendor lock-in | Use open standards (PostgreSQL, REST, OWASP) |

---

**Ready to start Phase 3? Let's go! 🚀**

**Next Step:** Begin Week 1 (Database & API skeleton)
