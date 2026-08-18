import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  country: string;

  @Column()
  timezone: string;

  @Column({ type: 'varchar', default: 'trial' })
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';

  @Column({ type: 'datetime', nullable: true })
  trial_ends_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  @Column({ type: 'datetime', nullable: true })
  deleted_at: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => TenantSubscription, (sub) => sub.tenant)
  subscriptions: TenantSubscription[];

  @OneToMany(() => TenantConfiguration, (config) => config.tenant)
  configurations: TenantConfiguration[];

  @OneToMany(() => ImportJob, (job) => job.tenant)
  import_jobs: ImportJob[];

  @OneToMany(() => OnboardingProgress, (progress) => progress.tenant)
  onboarding_progress: OnboardingProgress[];

  @OneToMany(() => BillingEvent, (event) => event.tenant)
  billing_events: BillingEvent[];
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ type: 'varchar', default: 'admin' })
  role: 'admin' | 'dispatcher' | 'driver' | 'carrier';

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_login: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  @Column({ type: 'datetime', nullable: true })
  deleted_at: Date;

  tenant: Tenant;
}

@Entity('tenant_subscriptions')
export class TenantSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  plan: 'basic' | 'pro' | 'enterprise';

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monthly_amount: number;

  @Column({ type: 'datetime' })
  billing_date: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  tenant: Tenant;
}

@Entity('tenant_configurations')
export class TenantConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ type: 'json', nullable: true })
  branding: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  email_templates: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  workflow_settings: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  feature_flags: Record<string, any>;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  tenant: Tenant;
}

@Entity('import_jobs')
export class ImportJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  file_name: string;

  @Column()
  entity_type: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'int', default: 0 })
  total_rows: number;

  @Column({ type: 'int', default: 0 })
  success_count: number;

  @Column({ type: 'int', default: 0 })
  error_count: number;

  @Column({ type: 'json', nullable: true })
  errors: Record<string, any>[];

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  tenant: Tenant;
}

@Entity('onboarding_progress')
export class OnboardingProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ type: 'int', default: 0 })
  current_step: number;

  @Column({ type: 'json' })
  completed_steps: boolean[];

  @Column({ type: 'json', nullable: true })
  step_data: Record<string, any>;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  tenant: Tenant;
}

@Entity('billing_events')
export class BillingEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  event_type: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;

  tenant: Tenant;
}
