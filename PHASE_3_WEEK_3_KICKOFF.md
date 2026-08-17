# Phase 3 Week 3: Security Hardening Kickoff

**Status:** Ready to Start ✅  
**Estimated Duration:** 5-6 hours  
**Difficulty:** Medium (security concepts + implementation)  
**Priority:** HIGH (launch blocker)

---

## 🔐 Week 3 Objectives

### Primary: Security Hardening (4 implementations)

1. **Password Reset Flow** (1-2 hours)
   - Endpoint: POST /api/v1/auth/password-reset
   - Generate time-limited reset token (15 min expiry)
   - Verify token + new password
   - Update user password + clear sessions
   - Email notification (optional for MVP, can stub)

2. **Rate Limiting** (1 hour)
   - Track login attempts per username
   - 3 failed attempts → 15-min lockout
   - Store in `login_attempt` table
   - Clear on successful login

3. **Session Timeout Enforcement** (1 hour)
   - Expire sessions after 30-min inactivity
   - Check `last_activity_at` on every request
   - Logout if expired
   - Refresh last_activity_at on each valid request

4. **HTTPS / CSP Headers** (30 mins)
   - Add helmet.js (security headers)
   - Content-Security-Policy
   - Strict-Transport-Security
   - X-Frame-Options
   - X-Content-Type-Options

### Secondary: Audit Logging Expansion
- Audit every CREATE/UPDATE/DELETE
- Track changed fields (old → new values)
- Store in `audit_log` table

---

## 📁 Files to Create/Modify

### 1. Password Reset Service (150 LOC)
**Create:** `backend/src/modules/auth/password-reset.service.ts`

```typescript
@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Session) private sessionsRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  async requestReset(email: string): Promise<{ message: string }> {
    // Find user by username or email (if email stored)
    // Generate reset token (JWT with 15-min expiry)
    // Send email with reset link (mock for MVP)
    // Return confirmation message
  }

  async validateResetToken(token: string): Promise<any> {
    // Verify JWT token still valid
    // Return payload (user_id)
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Validate token
    // Validate password strength
    // Hash new password
    // Update user.password_hash
    // Invalidate all sessions for this user
    // Return success
  }
}
```

### 2. Rate Limiting Service (120 LOC)
**Create:** `backend/src/modules/auth/rate-limit.service.ts`

```typescript
@Injectable()
export class RateLimitService {
  constructor(
    @InjectRepository(UserLoginAttempt) private attemptsRepository: Repository<UserLoginAttempt>,
  ) {}

  async recordAttempt(username: string, success: boolean, ipAddress: string) {
    // Store login attempt
    // If failed: increment counter
    // If 3+ failures: set lockout_until = now + 15 min
    // If success: clear failed attempts
  }

  async isLocked(username: string): Promise<boolean> {
    // Check if lockout_until > now
  }

  async getAttemptCount(username: string): Promise<number> {
    // Get failed attempts in last 15 minutes
  }
}
```

### 3. Session Timeout Middleware (80 LOC)
**Create:** `backend/src/modules/auth/session-timeout.middleware.ts`

```typescript
@Injectable()
export class SessionTimeoutMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (req.user && req.session) {
      const inactiveMs = Date.now() - req.session.last_activity_at.getTime();
      const timeoutMs = 30 * 60 * 1000; // 30 minutes

      if (inactiveMs > timeoutMs) {
        req.session.is_active = false;
        throw new UnauthorizedException('Session expired due to inactivity');
      }

      // Refresh activity timestamp
      req.session.last_activity_at = new Date();
    }

    next();
  }
}
```

### 4. Helmet Security Headers (40 LOC)
**Modify:** `backend/src/main.ts`

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add security headers
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    }),
  );

  // ... rest of bootstrap
}
```

### 5. Audit Logging Service (180 LOC)
**Create:** `backend/src/modules/audit/audit.service.ts`

```typescript
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepository: Repository<AuditLog>,
  ) {}

  async logChange(
    tenantId: number,
    tableName: string,
    recordId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
    changedBy?: string,
    ipAddress?: string,
  ) {
    // Store audit log entry
    // oldValues: previous state (for UPDATE)
    // newValues: new state
    // Enable "who changed what when" queries
  }

  async getAuditTrail(
    tenantId: number,
    tableName?: string,
    recordId?: number,
  ): Promise<AuditLog[]> {
    // Query audit logs with filters
  }
}
```

### 6. Update Auth Controller
**Modify:** `backend/src/modules/auth/auth.controller.ts`

Add endpoints:
```typescript
@Post('password-reset-request')
async requestPasswordReset(@Body() dto: { username: string }) {}

@Post('password-reset')
async resetPassword(@Body() dto: { token: string; password: string }) {}

@Get('login-attempts/:username')
@UseGuards(AdminGuard)
async getLoginAttempts(@Param('username') username: string) {}
```

### 7. Create UserLoginAttempt Entity
**Create:** `backend/src/entities/user-login-attempt.entity.ts`

```typescript
@Entity('user_login_attempts')
export class UserLoginAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  success: boolean;

  @Column({ nullable: true })
  ip_address: string;

  @Column()
  timestamp: Date;

  @Column({ nullable: true })
  locked_until: Date;
}
```

### 8. Database Migration
**Create:** `backend/src/database/migrations/1723...AddSecurityTables.ts`

Add tables:
- `user_login_attempts` (username, success, ip_address, timestamp, locked_until)
- Expand `sessions` with `last_activity_at` tracking (already in schema)

---

## 🛠️ Step-by-Step Implementation

### Step 1: Create Entities & Services (1.5 hours)
```bash
# Create entity
touch backend/src/entities/user-login-attempt.entity.ts

# Create services
touch backend/src/modules/auth/password-reset.service.ts
touch backend/src/modules/auth/rate-limit.service.ts

# Create middleware
touch backend/src/modules/auth/session-timeout.middleware.ts

# Create audit service
touch backend/src/modules/audit/audit.service.ts
```

### Step 2: Update Auth Controller (30 mins)
```typescript
// Add 2 new endpoints
@Post('password-reset-request')
@Post('password-reset')
```

### Step 3: Add Security Headers (20 mins)
```typescript
// Update main.ts to use helmet
import helmet from 'helmet';
app.use(helmet());
```

### Step 4: Integrate Rate Limiting (1 hour)
```typescript
// In auth.service.login()
await this.rateLimitService.recordAttempt(username, success, ipAddress);
if (await this.rateLimitService.isLocked(username)) {
  throw new UnauthorizedException('Too many failed attempts');
}
```

### Step 5: Integrate Session Timeout (1 hour)
```typescript
// In auth.module.ts
app.use(new SessionTimeoutMiddleware());

// Update TenantInterceptor to check session expiry
```

### Step 6: Integration Tests (1.5 hours)
```bash
touch backend/test/auth-security.e2e-spec.ts
```

Test scenarios:
- Password reset flow (request → verify → reset)
- Rate limiting (3 attempts lock)
- Session expiration (30-min timeout)
- Security headers present

---

## 🔑 Key Implementation Details

### Password Reset Flow
```
1. User requests reset (POST /password-reset-request)
   → Find user
   → Generate JWT token with 15-min expiry
   → Send email with reset link (mock for now)
   → Return "Check your email"

2. User clicks link, provides new password (POST /password-reset)
   → Verify JWT token still valid
   → Validate password strength
   → Hash new password
   → Update user.password_hash
   → Invalidate all user's sessions (force re-login)
   → Return "Password reset successfully"
```

### Rate Limiting
```
1. Login attempt fails
   → Record failed attempt (username, ip_address, timestamp)

2. Check login status
   → Count failed attempts in last 15 minutes
   → If >= 3: set locked_until = now + 15 min
   → Return "Too many attempts, try again in X min"

3. Login succeeds
   → Clear failed attempts for this username
   → Reset counter to 0
```

### Session Timeout
```
1. Every request with JWT token
   → TenantInterceptor checks request.session
   → Calculate: now - last_activity_at
   → If > 30 minutes: expire session
   → Return 401 Unauthorized "Session expired"

2. On successful request
   → Update last_activity_at = now
   → Keep session alive
```

### Security Headers (Helmet)
```
Strict-Transport-Security: max-age=31536000 (1 year HTTPS)
X-Frame-Options: DENY (no iframe embedding)
X-Content-Type-Options: nosniff (prevent MIME sniffing)
Content-Security-Policy: ... (script/style restrictions)
```

---

## ✅ Success Criteria

**Functionality:**
- [ ] Password reset endpoint works (token valid, password updated)
- [ ] Rate limiting blocks after 3 failures
- [ ] Session expires after 30-min inactivity
- [ ] Security headers present in responses
- [ ] Audit log captures all changes

**Security:**
- [ ] Passwords never returned in API
- [ ] Reset tokens time-limited (15 min)
- [ ] Session tokens invalidated on logout
- [ ] Lockout prevents brute force
- [ ] All changes audited (who/what/when)

**Testing:**
- [ ] 10+ new integration tests
- [ ] All edge cases covered
- [ ] Error messages helpful but not leaky

**Documentation:**
- [ ] README.md updated with new endpoints
- [ ] Security best practices documented

---

## 🚀 After Week 3

**Week 4:** Customer CRUD
- Similar pattern as User CRUD
- Rate agreements
- Billing contacts

**Week 5-6:** Trip & Invoice Management
- Trip creation from bookings
- Vehicle condition checklist
- Invoice generation
- Payment tracking

---

## 💡 Tips

1. **Use TypeORM lifecycle hooks** for automatic audit logging
2. **Test rate limiting locally** before deploying
3. **Session timeout should be configurable** (env var: SESSION_TIMEOUT_MINUTES)
4. **Password reset tokens should be non-guessable** (use crypto.randomBytes)
5. **Audit logs should be append-only** (never delete, only read)

---

## 🔗 Quick References

- **Password Hashing:** Already using bcrypt in User Service
- **JWT Expiry:** Already set to 24h access, 7d refresh
- **Rate Limiting Patterns:** Use counter + lockout window
- **Session Management:** Database-backed (not in-memory)

---

## ⏱️ Time Budget (6 hours total)

| Task | Time |
|------|------|
| Create services (rate limit, reset) | 1.5 hours |
| Add password reset endpoints | 30 min |
| Integrate rate limiting in login | 1 hour |
| Session timeout middleware | 1 hour |
| Add security headers | 20 min |
| Integration tests | 1.5 hours |
| Documentation | 20 min |
| **Total** | **~6 hours** |

---

## 🎯 What This Enables

After Week 3 completes:
- ✅ Users can reset forgotten passwords
- ✅ Brute force attacks blocked (rate limiting)
- ✅ Inactive sessions auto-logout
- ✅ Security headers prevent common attacks
- ✅ Complete audit trail of all changes
- ✅ Ready for security audit/compliance review

---

**Ready to Start?** 🚀

All infrastructure in place. Week 3 is well-scoped, no blockers.

```bash
cd backend
npm run start:dev
# Then implement password reset service...
```

---

**Next Session Status:** Week 3 Security Hardening — Ready to Launch ✅  
**Blocker Count:** 0  
**Confidence Level:** HIGH (proven pattern from Weeks 1-2)
