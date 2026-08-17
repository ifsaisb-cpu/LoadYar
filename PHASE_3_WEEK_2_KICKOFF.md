# Phase 3 Week 2: User CRUD & Permission Guards Kickoff

**Status:** Ready to Start Now ✅  
**Estimated Duration:** 4-5 hours  
**Difficulty:** Medium (no blockers, clear requirements)

---

## 🎯 Week 2 Objectives

### Primary: User CRUD Endpoints (3 endpoints)
```
GET /api/v1/users                    → List all users in tenant
POST /api/v1/users                   → Create new user
PATCH /api/v1/users/:id              → Update user
DELETE /api/v1/users/:id             → Delete (soft) user
```

### Secondary: Permission Guards
- Only admins can CRUD users
- Tenants are auto-scoped (admin can't see other tenant's users)
- Password validation rules
- Username uniqueness per tenant

### Tertiary: Testing
- 15+ integration tests
- Auth + user creation happy path
- Permission validation tests

---

## 📁 Files to Create

### 1. User Service (150 LOC)
**Path:** `backend/src/modules/users/user.service.ts`

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(dto: CreateUserDto, tenantId: number, createdBy: string) {
    // Hash password with bcrypt
    // Check username uniqueness per tenant
    // Save user with tenant_id
    // Return created user (no password_hash)
  }

  async getUsers(tenantId: number) {
    // Return all users for tenant (no password_hash)
  }

  async updateUser(id: number, dto: UpdateUserDto, tenantId: number) {
    // Find user in tenant
    // Update fields (password if provided)
    // Return updated user
  }

  async deleteUser(id: number, tenantId: number) {
    // Soft delete (set deleted_at)
  }
}
```

### 2. User Controller (100 LOC)
**Path:** `backend/src/modules/users/user.controller.ts`

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  @Get()
  @UseGuards(AdminGuard)
  async getUsers(@Request() req: any) {
    return this.userService.getUsers(req.user.tenant_id);
  }

  @Post()
  @UseGuards(AdminGuard)
  async createUser(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.userService.createUser(dto, req.user.tenant_id, req.user.username);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async updateUser(@Param('id') id: number, @Body() dto: UpdateUserDto, @Request() req: any) {
    return this.userService.updateUser(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id') id: number, @Request() req: any) {
    return this.userService.deleteUser(id, req.user.tenant_id);
  }
}
```

### 3. DTOs (80 LOC)
**Path:** `backend/src/modules/users/dto/create-user.dto.ts`

```typescript
export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  @IsUnique()
  username: string;

  @IsEnum(['admin', 'dispatcher', 'driver', 'carrier'])
  role: string;

  @IsEnum(['click', 'password'])
  auth_mode: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string; // Required if auth_mode='password'

  @IsOptional()
  driver_id?: number;

  @IsOptional()
  carrier_id?: number;
}

export class UpdateUserDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  role?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  status?: string; // 'active' or 'inactive'
}
```

### 4. Permission Guard (60 LOC)
**Path:** `backend/src/common/guards/admin.guard.ts`

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
```

### 5. Integration Tests (250+ LOC)
**Path:** `backend/test/users.e2e-spec.ts`

Test scenarios:
1. ✅ Admin can create user in their tenant
2. ✅ Dispatcher cannot create user (forbidden)
3. ✅ Username must be unique per tenant
4. ✅ Password hashed (not stored plain)
5. ✅ Created user can login with new credentials
6. ✅ Admin cannot see other tenant's users
7. ✅ User fields validated (role enum, auth_mode enum, etc)
8. ✅ Soft delete (deleted_at set, still in DB)
9. ✅ 10+ more edge cases

---

## 🛠️ Step-by-Step Implementation

### Step 1: Create User Service & DTOs
```bash
# Create files structure
mkdir -p backend/src/modules/users/dto

# Create service
touch backend/src/modules/users/user.service.ts

# Create DTOs
touch backend/src/modules/users/dto/create-user.dto.ts
touch backend/src/modules/users/dto/update-user.dto.ts
```

**Time:** 30 mins

### Step 2: Create User Controller
```bash
touch backend/src/modules/users/user.controller.ts
```

**Time:** 20 mins

### Step 3: Create Permission Guards
```bash
touch backend/src/common/guards/admin.guard.ts

# Update app.module.ts to export guard
```

**Time:** 15 mins

### Step 4: Update Users Module
```typescript
// backend/src/modules/users/users.module.ts
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
```

**Time:** 10 mins

### Step 5: Write Integration Tests
```bash
touch backend/test/users.e2e-spec.ts
```

**Test Template:**
```typescript
describe('UserController (e2e)', () => {
  it('should create user for admin', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'ali', tenant_id: 1 });

    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`)
      .send({
        name: 'Test User',
        username: 'test_user',
        role: 'dispatcher',
        auth_mode: 'password',
        password: 'Secure@123',
      })
      .expect(201);
  });

  it('should reject if not admin', async () => {
    // Login as dispatcher, try to create user
    // Should return 403 Forbidden
  });

  // ... 15+ more tests
});
```

**Time:** 2 hours

### Step 6: Test & Debug
```bash
npm run start:dev   # In one terminal
npm test            # In another terminal
```

**Time:** 1 hour

---

## 🔑 Key Implementation Details

### Password Hashing
```typescript
import * as bcrypt from 'bcrypt';

// In user.service.ts
if (dto.password) {
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(dto.password, salt);
}
```

### Username Uniqueness Per Tenant
```typescript
// In user.service.ts
const existing = await this.usersRepository.findOne({
  where: {
    tenant_id: tenantId,
    username: dto.username,
  },
});

if (existing) {
  throw new ConflictException('Username already exists in this tenant');
}
```

### Auto-Tenant Scoping
```typescript
// TenantInterceptor already extracts from JWT
// Just use it in controller
const tenantId = req.user.tenant_id; // Automatically set

// Service method signature
async getUsers(tenantId: number) {
  return this.usersRepository.find({
    where: { tenant_id: tenantId, deleted_at: IsNull() },
  });
}
```

### Soft Delete
```typescript
// Don't actually delete, just set deleted_at
await this.usersRepository.update(
  { id, tenant_id: tenantId },
  { deleted_at: new Date() },
);
```

---

## ✅ Success Criteria

**Code Quality:**
- [ ] All DTOs have validation decorators
- [ ] All endpoints use JwtAuthGuard + AdminGuard
- [ ] No password_hash in API responses
- [ ] Proper HTTP status codes (201 for create, 404 for not found, 403 for forbidden)
- [ ] Error messages are helpful (not "Error")

**Testing:**
- [ ] 15+ tests pass
- [ ] Admin scenario passes
- [ ] Permission scenario passes
- [ ] Cross-tenant isolation passes
- [ ] Password hashing verified (not plain text)

**Documentation:**
- [ ] README.md updated with new endpoints
- [ ] API response examples added
- [ ] Permission matrix documented

---

## 🚀 After Week 2

**Week 3:** Security Hardening
- Password reset flow
- Rate limiting
- Session timeout
- Audit logging

**Week 4:** Customer CRUD
- Similar pattern as User CRUD
- Rate agreements
- Billing contacts

---

## 💡 Tips

1. **Test as you code:** Run `npm test` after each file to catch errors early
2. **Use Postman/Insomnia:** Test endpoints manually before writing integration tests
3. **Check the schema:** Refer to `src/database/schema.sql` for column details
4. **Follow the pattern:** User CRUD pattern will repeat for Customers, Carriers, etc.
5. **Commit frequently:** Commit after each completed step

---

## 🔗 Quick References

- **User Entity:** `backend/src/entities/user.entity.ts`
- **Auth Service:** `backend/src/modules/auth/auth.service.ts` (password hashing example)
- **Database Schema:** `backend/src/database/schema.sql`
- **NestJS Docs:** https://docs.nestjs.com/
- **TypeORM Docs:** https://typeorm.io/

---

## ⏱️ Time Budget (5 hours total)

| Task | Time |
|------|------|
| Create service & DTOs | 30 min |
| Create controller | 20 min |
| Create guards | 15 min |
| Update module | 10 min |
| Write tests | 2 hours |
| Test & debug | 1 hour |
| Documentation | 30 min |
| **Total** | **~4.5 hours** |

---

**Ready to Start?** 🚀
```bash
cd backend
npm run start:dev
# Then start implementing User Service...
```

---

**Next Session Status:** Week 2 User CRUD — Ready to Launch ✅  
**Blocker Count:** 0  
**Confidence Level:** HIGH (foundation is solid)
