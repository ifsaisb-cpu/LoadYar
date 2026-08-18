-- Phase 2.5: Multi-Tenant Onboarding Tables
-- Migration: Add tenant subscriptions, configurations, billing events

BEGIN;

-- Tenant Subscriptions (billing status, plan, dates)
CREATE TABLE tenant_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'basic', -- basic, pro, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, suspended, cancelled
  monthly_fee NUMERIC(14,2) NOT NULL DEFAULT 30000.00, -- ₨30K/month
  trial_ends_at TIMESTAMP,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50), -- easypaisa, jazzcash, bank_transfer
  last_payment_at TIMESTAMP,
  next_due_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Tenant Configurations (branding, settings)
CREATE TABLE tenant_configurations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#007bff',
  company_name VARCHAR(255),
  website VARCHAR(500),
  phone VARCHAR(20),
  tax_id VARCHAR(50),
  country VARCHAR(50) DEFAULT 'Pakistan',
  city VARCHAR(100),
  require_expense_approval BOOLEAN DEFAULT FALSE,
  expense_approval_threshold NUMERIC(14,2) DEFAULT 50000.00,
  enable_gps_tracking BOOLEAN DEFAULT TRUE,
  enable_notifications BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en', -- en, ur
  timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Billing Events (audit trail for billing actions)
CREATE TABLE billing_events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- signup, payment_received, suspension, cancellation, upgrade
  description TEXT,
  amount NUMERIC(14,2),
  reference_id VARCHAR(255), -- invoice_id, payment_id, etc.
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Onboarding Progress (track which steps completed)
CREATE TABLE onboarding_progress (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  step_1_company BOOLEAN DEFAULT FALSE,
  step_2_vehicles BOOLEAN DEFAULT FALSE,
  step_3_drivers BOOLEAN DEFAULT FALSE,
  step_4_rates BOOLEAN DEFAULT FALSE,
  step_5_gl_accounts BOOLEAN DEFAULT FALSE,
  step_6_review BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Billing Invoices (track all invoices per tenant)
CREATE TABLE billing_invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, issued, paid, overdue, cancelled
  issued_at TIMESTAMP,
  due_at TIMESTAMP,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  reference_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
  UNIQUE(tenant_id, invoice_number)
);

-- Indexes for performance
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX idx_tenant_subscriptions_next_due ON tenant_subscriptions(next_due_at);
CREATE INDEX idx_billing_events_tenant_type ON billing_events(tenant_id, event_type);
CREATE INDEX idx_billing_invoices_tenant_status ON billing_invoices(tenant_id, status);
CREATE INDEX idx_onboarding_progress_active ON onboarding_progress(is_active);

COMMIT;
