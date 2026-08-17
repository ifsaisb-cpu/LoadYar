# LoadYar Multi-Tenant Login System

## Overview
LoadYar operates as a SaaS platform with three user levels:
1. **LoadYar Super Admin** - Manages the entire platform, sees all tenants
2. **Tenant Admin** - Manages one client company
3. **Tenant Users** - Dispatchers, drivers, carriers within a tenant

---

## Login Flow

### Step 1: User Selection
```
Login Screen
├─ User Dropdown (allScoped users from current tenant_id context)
│  ├─ LoadYar Super Admin
│  ├─ Ali (Admin) — UTN
│  ├─ Dispatcher Karachi — UTN
│  ├─ Admin (Test A) — Test A
│  └─ Admin (Test B) — Test B
└─ Click "Continue"
```

### Step 2: Password (if required)
```
Only users with auth_mode='password' see password prompt
┌─────────────────────────┐
│ Enter Password          │
│ [••••••••]              │
│ [Login Button]          │
└─────────────────────────┘
```

**Test Credentials:**
| User | Password |
|------|----------|
| LoadYar Super Admin | SuperAdmin@2026 |
| Dispatcher Karachi | KPipri@2026 |
| Dispatcher Lahore | Lahore@2026 |

### Step 3: Tenant/Workspace Selection
```
After password validation, tenant selection appears:

Super Admin sees:
  ✓ United Transport Network
  ✓ Test Client A
  ✓ Test Client B

Regular Admin (Ali) sees:
  ✓ United Transport Network (only)

Admin (Test A) sees:
  ✓ Test Client A (only)
```

### Step 4: Login Complete
```
System sets:
- state.user = {id, name, role, tenant_id, ...}
- state.tenant = {id, name, slug, region, ...}
- sessionStorage.mucrm_uid = userId

Redirect to dashboard based on role:
- Admin → #/dashboard (full view)
- Dispatcher → #/trips (operations only)
- Driver → #/trips (own trips only)
- Carrier → #/trips (read-only portal)
```

---

## Data Isolation

### How It Works
All queries use `allScoped(collection)` which filters by `state.tenant.id`:

```javascript
// Example: Get bookings for current tenant only
allScoped('bookings')
// Returns: bookings WHERE tenant_id = state.tenant.id

// Example: Super admin querying bookings
// If state.tenant is null, allScoped returns nothing (or all)
// Solution: Super admin must select a tenant first
```

### Query Layers
| Query Type | Scope |
|------------|-------|
| `all()` | Global (no filtering) |
| `allScoped()` | Current tenant only |
| `byId()` | By ID (no filtering, but used with scoped results) |

### Data Owned by Tenant
- Bookings, Trips, Invoices
- Customers, Rate Agreements
- Drivers, Carriers
- Vendors, Clearing Agents
- Expenses, Payables
- GL Accounts, Account Entries

### Shared Across Tenants
- Dropdown lists (cities, vehicle types, etc.)
- System settings (via Settings & Backup)

---

## Seeded Test Users

### LoadYar Platform
| User | Role | Tenant | Auth | Notes |
|------|------|--------|------|-------|
| LoadYar Super Admin | admin | null | Password | Can see all 3 tenants |

### United Transport Network (UTN)
| User | Role | Tenant | Auth | Notes |
|------|------|--------|------|-------|
| Ali (Admin) | admin | UTN | None | No password needed |
| Dispatcher — Karachi Pipri | dispatcher | UTN | Password | KPipri@2026 |
| Dispatcher — Hyderabad | dispatcher | UTN | Password | Hyderabad@2026 |
| Dispatcher — Lahore | dispatcher | UTN | Password | Lahore@2026 |
| Rashid Khan (Driver) | driver | UTN | None | Driver ID: 1 |
| Bilal Ahmed (Driver) | driver | UTN | None | Driver ID: 2 |
| Faisal (Karachi Carriers) | carrier | UTN | None | Carrier ID: 1 |

### Test Client A
| User | Role | Tenant | Auth |
|------|------|--------|------|
| Admin (Test A) | admin | Test A | None |

### Test Client B
| User | Role | Tenant | Auth |
|------|------|--------|------|
| Admin (Test B) | admin | Test B | None |

---

## Testing Multi-Tenant Isolation

### Test 1: Super Admin Views All Tenants
```
1. Login as: LoadYar Super Admin
2. Password: SuperAdmin@2026
3. Workspace selector shows: ✓ UTN, ✓ Test A, ✓ Test B
4. Select: Test Client A
5. Verify: state.tenant.id = 2 (Test A's ID)
```

### Test 2: Regular Admin Limited to Own Tenant
```
1. Login as: Ali (Admin)
2. No password required
3. Workspace selector shows: ✓ UTN only
4. Cannot select Test A or Test B
5. Verify: state.tenant.id = 1 (UTN's ID)
```

### Test 3: Data Isolation
```
Login as Ali (UTN Admin):
- GET /trips → shows only UTN trips (bilty MU-2026-0001, 50435)
- GET /customers → shows only UTN customers
- GET /invoices → shows only UTN invoices

Login as Admin (Test A):
- GET /trips → shows 0 trips (Test A has no data yet)
- GET /customers → shows 0 customers (Test A has no data yet)
- Cannot see UTN's data
```

### Test 4: Permission Enforcement
```
Dispatcher (non-admin):
- Can access #/trips, #/expenses, #/claims
- Cannot access #/dashboard, #/settings, #/finance
- Row-level scoping: driver sees only own trips
- Tenant-level scoping: cannot see other tenants

Driver:
- Can access #/trips (own only)
- Cannot see other drivers' trips
- Cannot access #/expenses (tenant-level)
```

---

## Adding New Users

### Manual Seeding
Edit `seedDB()` function in index.html:
```javascript
const tenantUTN = a('tenants', {...});

// Add new user for UTN
a('users', {
  name: 'John Dispatcher',
  role: 'dispatcher',
  auth_mode: 'password',
  username: 'johndispatcher',
  password_hash: simpleHash('Password@2026'),
  tenant_id: tenantUTN.id
});
```

### Via UI (Phase 3)
Settings → Users → + New User
- Restricted to admin users
- Users created within current tenant context
- Tenant-scoped automatically

---

## Phase 3: User Creation UI

**Location:** Settings & Backup → Users tab

**Features:**
- Create users for current tenant only
- Set role (admin, dispatcher, driver, carrier)
- Set password or auto-generate
- Bulk import from CSV
- Edit/disable users
- Reset password
- View audit log (who created/edited each user)

---

## Security

### Current
✅ Password hashing (simpleHash)
✅ Session storage (sessionStorage.mucrm_uid)
✅ Tenant-level data isolation
✅ Role-based access (guards on pages)

### TODO (Phase 3)
⚠️ Upgrade to bcrypt
⚠️ Add HTTPS enforcement
⚠️ Add session timeout (30 min inactivity)
⚠️ Add audit log for all user actions
⚠️ Add 2FA for super admin

---

## Code References

| Component | Location |
|-----------|----------|
| Login HTML | Line 8105 |
| User Selection | Line 8150 |
| Password Prompt | Line 8133 |
| Tenant Selection | Line 8109 |
| Login Function | Line 8200 |
| State Setup | Line 519 |
| Seed Data | Line 1336 |
| Permission Matrix | Line 508 |

---

**Last Updated:** 2026-08-17
**Status:** Phase 2.5 Complete ✅
