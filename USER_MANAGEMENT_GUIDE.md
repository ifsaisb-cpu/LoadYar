# LoadYar User Management Guide

## Overview
Admins can create, edit, and manage users within their tenant. Each user belongs to exactly one tenant and can only see data scoped to that tenant.

---

## Creating a New User

### Step 1: Navigate to Settings & Backup
```
Left Sidebar → Settings & Backup → Users & Logins section
```

### Step 2: Click "+ Add User"
```
A modal opens showing:
- Current tenant context (e.g., "Tenant: United Transport Network")
- User creation form
```

### Step 3: Fill User Details

| Field | Required | Notes |
|-------|----------|-------|
| **Name** | ✅ | Full name (e.g., "Amir Dispatcher") |
| **Role** | ✅ | admin / dispatcher / driver / carrier |
| **Driver Record** | Only if role=driver | Link to driver in system |
| **Carrier Record** | Only if role=carrier | Link to carrier in system |
| **Login Type** | ✅ | Quick click (no password) OR Username + Password |
| **Username** | If password login | Unique identifier (e.g., amir_disp, must be unique within tenant) |
| **Password** | If password login | Set a strong password (note: plain text in browser, not server) |

### Step 4: Save
Click **Save** button → User is created for current tenant

---

## User Roles & Permissions

### 👨‍💼 Admin
- Full access to all features
- Can create/edit/delete users
- Can access Settings & Backup
- Can see all tenant data
- Can generate reports
- Can manage GL accounts

### 📋 Dispatcher
- Can access Booking & Operations
- Can create/edit trips and bilties
- Can manage expenses and claims
- Cannot access Settings or Financial reports
- Cannot create other users
- Row-level scoped: Sees all company trips (not personal)

### 🚗 Driver
- Can access own trips only
- Can view and manage personal checklist items
- Can log personal expenses
- Cannot access other drivers' data
- Cannot access Settings

### 🏢 Carrier
- Can access carrier portal (read-only)
- Can view trips assigned to their carrier
- Cannot edit or delete anything
- Cannot access Settings

---

## User Authentication Modes

### Quick Click (No Password)
```
✓ One-click login
✓ Easy for shared office device
✓ No password required
✗ Less secure for remote workers
```

**Use for:**
- Admin in secure office
- Driver using company device
- Dispatcher at dispatch desk

### Username + Password
```
✓ Suitable for remote access
✓ Requires verification every login
✓ More secure for multiple users per device
✗ Slower login process
```

**Use for:**
- Dispatcher working from home
- Contractor carriers
- Admin account (recommended)
- High-security environments

---

## Managing Existing Users

### View All Users
Settings & Backup → Users & Logins section shows:
```
┌─────────────────────────────────────────────────────────┐
│ A  Ali (Admin)              [Edit] [Delete]             │
│ D  Dispatcher Karachi  🔒 @kpipri  [Edit] [Delete]     │
│ D  Dispatcher Lahore   🔒 @lahore  [Edit] [Delete]     │
│ R  Rashid Khan (Driver)            [Edit] [Delete]     │
└─────────────────────────────────────────────────────────┘
```

**Legend:**
- 🔒 = Password protected (username shown)
- Avatar = User's first letter
- Badge = Role

### Edit User
1. Click **Edit** next to user
2. Change name, role, password, or login type
3. Click **Save**

**Notes:**
- Password field is blank when editing (can update password by entering new one)
- Cannot change username for password-login users (would require rework)
- Changing role from dispatcher → driver will prompt for driver record selection

### Delete User
1. Click **Delete** next to user
2. Confirm deletion
3. User is soft-deleted (data preserved, cannot login)

**Cannot Delete:**
- Your own account while logged in (system prevents this)
- Admins should disable rather than delete (to maintain audit trail)

---

## Tenant-Scoped User Management

### How It Works
```
Alice logs in as Admin for "Test Client A"
    ↓
state.tenant = {id: 2, name: "Test Client A", ...}
    ↓
Click Settings → Users & Logins
    ↓
allScoped('users') returns only Test Client A's users
    ↓
Shows: Admin (Test A), any others created for Test A
    ↓
Cannot see: UTN users, Test B users
```

### Creating Users in Different Tenants

**Scenario: Super Admin managing multiple tenants**

```
1. Super Admin logs in, selects "United Transport Network"
   state.tenant = {id: 1, name: "United Transport Network"}
   ↓
   Can create users → these users belong to UTN
   
2. Go back, log out and in again
   Select "Test Client A"
   state.tenant = {id: 2, name: "Test Client A"}
   ↓
   Can create users → these users belong to Test Client A
   
3. Select "Test Client B"
   state.tenant = {id: 3, name: "Test Client B"}
   ↓
   Can create users → these users belong to Test Client B
```

### Isolation Guarantee

✅ Users see only users in their tenant  
✅ New users automatically assigned to current tenant  
✅ Username uniqueness enforced per tenant (not globally)  
✅ Cannot assign user to different tenant via UI  

---

## Common Tasks

### Task 1: Set Up Team for New Tenant
```
1. Super Admin logs in
2. Workspace selector → Select new tenant
3. Settings → Users & Logins
4. Click "+ Add User" for each team member:
   - Manager → Admin role
   - Dispatcher → Dispatcher role, password login
   - Drivers → Driver role, select driver record
   - Carrier → Carrier role, select carrier record
5. Each user can now log in and see only their tenant's data
```

### Task 2: Disable User Without Losing Data
```
1. Click Edit next to user
2. Change Role to something temporary or note in records
3. Click Save
4. User can still log in but with reduced permissions
5. Later: Click Delete when ready to fully deactivate

OR

1. Click Delete
2. Soft-delete preserves all their historical data
3. Their names still appear on old trips/invoices
4. They cannot log in
```

### Task 3: Change User's Role
```
1. Click Edit
2. Change Role dropdown (e.g., dispatcher → driver)
3. If changing to driver/carrier, select associated record
4. Click Save
5. User has new role on next login
```

### Task 4: Reset User Password
```
1. Click Edit
2. Enter new password in Password field (will not be blank)
3. Click Save
4. User must use new password on next login
5. Note: Cannot show old password (hashed only)
```

---

## Multi-Tenant User Creation Workflow

### Example: LoadYar Admin Adding Users to Multiple Clients

**Monday: Add users for UTN**
```
1. LoadYar Super Admin logs in with password: SuperAdmin@2026
2. Workspace selector appears → Choose "United Transport Network"
3. state.tenant.id = 1
4. Settings → + Add User
   • Create: Ali (Admin)
   • Create: Dispatcher Karachi (with password)
   • Create: Driver users
5. All users automatically belong to UTN (tenant_id=1)
```

**Tuesday: Add users for Test Client A**
```
1. Log out and back in as LoadYar Super Admin
2. Workspace selector → Choose "Test Client A"
3. state.tenant.id = 2
4. Settings → + Add User
   • Create: Client A Admin
   • Create: Dispatcher for Client A
5. All users automatically belong to Test A (tenant_id=2)
```

**Data Isolation Confirmed:**
```
UTN Admin logs in:
  → Can see: UTN users only
  → Cannot see: Test A/B users
  
Test A Admin logs in:
  → Can see: Test A users only
  → Cannot see: UTN/Test B users
  
Super Admin logs in:
  → Workspace selector shows all 3 tenants
  → Can switch between and manage all users
```

---

## Troubleshooting

### User Cannot Log In
**Check:**
1. Is user account deleted? (Click Edit, should show user)
2. Is password correct? (For password-login users)
3. Is username correct? (Username is case-sensitive)
4. Is username/password combo unique to this tenant?

**Solution:**
1. Click Edit next to user
2. Reset password (enter new one)
3. Click Save
4. User can now log in with new password

### User Sees Another Tenant's Data
**Problem:** User should only see Test A, but can see UTN data

**Check:**
1. Is user's tenant_id correct? (Should be Test A's id)
2. Is data properly scoped? (Check allScoped() queries)
3. Did user manually select wrong workspace?

**Solution:**
1. Log out
2. Log in again
3. Select correct workspace
4. Or: Edit user, verify tenant_id is correct

### Cannot Create User (Error: "No tenant context")
**Problem:** "+ Add User" shows error about no tenant

**Cause:** Super Admin hasn't selected a workspace yet

**Solution:**
1. Log out
2. Log in as Super Admin
3. Workspace selector appears
4. **Select a tenant** (e.g., "United Transport Network")
5. NOW click Settings → Users & Logins
6. "+ Add User" should work

---

## Phase 4 Enhancements (Future)

📋 **Bulk User Import (CSV)**
```csv
name,role,username,password
Ali,admin,,
Amir Dispatcher,dispatcher,amir,Amir@2026
```

🔐 **Password Reset Link**
- User clicks "Forgot Password"
- Receives reset link (local storage only, no email)
- Sets new password

📊 **User Audit Log**
- Track who created/edited each user
- See login history per user
- Export for compliance

🔑 **2FA (Two-Factor Authentication)**
- Especially for Super Admin
- TOTP-based (Google Authenticator)

👥 **Bulk Actions**
- Disable/enable multiple users at once
- Change role for multiple users
- Export user list

---

## Code References

| Component | Location | Notes |
|-----------|----------|-------|
| User list display | Line 7863 | Renders users with Edit/Delete buttons |
| User form modal | Line 7873 | Opens when clicking "+ Add User" or Edit |
| User save logic | Line 7905 | Validates and saves user data |
| User delete logic | Line 7927 | Soft-deletes user (preserves data) |
| Tenant context display | Line 7878 | Shows current tenant when creating user |
| Tenant-id assignment | Line 7924 | Sets tenant_id for new users |

---

## Data Model

```javascript
User {
  id: 1,
  name: "Ali (Admin)",
  role: "admin",  // admin, dispatcher, driver, carrier
  tenant_id: 1,   // Which tenant this user belongs to
  auth_mode: "click",  // click or password
  username: null,      // Only if auth_mode=password
  password_hash: null, // Hashed password, salted with tenant_id
  driver_id: null,     // Only if role=driver
  carrier_id: null,    // Only if role=carrier
  status: "active",    // active or inactive
  created_at: "2026-08-17T...",
  updated_at: "2026-08-17T...",
  deleted_at: null     // Soft delete timestamp
}
```

---

**Last Updated:** 2026-08-17  
**Status:** Phase 2.5 Complete ✅  
**Next:** Phase 3 — Bulk import, audit log, 2FA
