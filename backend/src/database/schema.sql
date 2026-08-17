-- LoadYar Database Schema
-- PostgreSQL 15+
-- Multi-tenant, audit-enabled, GAAP-ready GL accounting

-- ============================================================================
-- CORE TENANT & USER MANAGEMENT
-- ============================================================================

CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  region VARCHAR(100),
  contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL, -- admin, dispatcher, driver, carrier
  auth_mode VARCHAR(20) DEFAULT 'click', -- click or password
  driver_id INTEGER,
  carrier_id INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL,
  UNIQUE(tenant_id, username) -- username unique per tenant
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_token VARCHAR(500) NOT NULL UNIQUE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);

CREATE TABLE user_login_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100),
  success BOOLEAN,
  ip_address VARCHAR(45),
  user_agent TEXT,
  failure_reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MASTER DATA: CUSTOMERS & RATE AGREEMENTS
-- ============================================================================

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  plant VARCHAR(255),
  delivery_points TEXT,
  billing_contact VARCHAR(255),
  ops_contact VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE rate_agreements (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  route VARCHAR(255),
  route_from VARCHAR(100),
  route_to VARCHAR(100),
  vehicle_type VARCHAR(100),
  rate_paisa NUMERIC(14,2), -- PKR in paisa
  valid_from DATE,
  valid_to DATE,
  fuel_clause TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- CARRIERS & DRIVERS
-- ============================================================================

CREATE TABLE carriers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(20),
  pay_type VARCHAR(50), -- flat_rate, cost_plus
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  carrier_id INTEGER REFERENCES carriers(id),
  name VARCHAR(255) NOT NULL,
  license VARCHAR(50),
  contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- VENDORS & CLEARING AGENTS
-- ============================================================================

CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- tyre, repairs, fuel, etc
  contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE clearing_agents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(20),
  city_port VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- BOOKINGS & TRIPS (CORE)
-- ============================================================================

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  booking_date DATE NOT NULL,
  bilty_no VARCHAR(50),
  gate_pass VARCHAR(100),
  route_from VARCHAR(100),
  destination VARCHAR(100),
  consignee VARCHAR(255),
  requested_pickup DATE,
  status VARCHAR(50), -- open, converted, booked
  trip_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bilty_no VARCHAR(50) NOT NULL,
  booking_id INTEGER REFERENCES bookings(id),
  entry_mode VARCHAR(20), -- digital, manual_logged
  date DATE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  route VARCHAR(255),
  consigner VARCHAR(255),
  consignee VARCHAR(255),
  consignee_address TEXT,
  carrier_id INTEGER REFERENCES carriers(id),
  driver_id INTEGER REFERENCES drivers(id),
  booking_time VARCHAR(10),
  return_load_type VARCHAR(50),
  status VARCHAR(50), -- booked, in_transit, delivered, closed
  freight_paisa NUMERIC(14,2),
  open_market BOOLEAN,
  rate_agreement_id INTEGER REFERENCES rate_agreements(id),
  rate_overridden BOOLEAN,
  media_ref TEXT,
  veh_make VARCHAR(100),
  veh_type VARCHAR(50),
  veh_chassis VARCHAR(50),
  veh_engine VARCHAR(50),
  veh_colour VARCHAR(50),
  veh_model VARCHAR(50),
  veh_reg VARCHAR(50),
  veh_condition VARCHAR(100),
  agent_id INTEGER REFERENCES clearing_agents(id),
  agent_cost_paisa NUMERIC(14,2),
  notes TEXT,
  journey_id INTEGER,
  load_from VARCHAR(100),
  load_to VARCHAR(100),
  pay_status VARCHAR(50), -- to_be_billed, to_pay, partial, paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_trips_tenant ON trips(tenant_id);
CREATE INDEX idx_trips_bilty ON trips(bilty_no);
CREATE INDEX idx_trips_customer ON trips(customer_id);
CREATE INDEX idx_trips_date ON trips(date);
CREATE INDEX idx_trips_status ON trips(status);

-- ============================================================================
-- CHECKLISTS & CONDITIONS
-- ============================================================================

CREATE TABLE vehicle_checklists (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stage VARCHAR(50), -- pickup, delivery
  items JSONB, -- [{i: 0, state: 'present'|'missing'|'damaged', note: ''}]
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EXPENSES & FUEL
-- ============================================================================

CREATE TABLE trip_expenses (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  journey_id INTEGER,
  type VARCHAR(50), -- toll_tax, driver_advance, food, fuel
  location VARCHAR(255),
  amount_paisa NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  account_id INTEGER, -- FK to GL accounts
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

CREATE TABLE fuel_log (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  journey_id INTEGER,
  trip_id INTEGER REFERENCES trips(id),
  pump VARCHAR(255),
  litres DECIMAL(8,2),
  total_paisa NUMERIC(14,2) NOT NULL,
  account_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- GL ACCOUNTING (GAAP-READY)
-- ============================================================================

CREATE TABLE chart_of_accounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- Asset, Liability, Equity, Revenue, Expense, Suspense
  sub_type VARCHAR(100),
  opening_paisa NUMERIC(14,2) DEFAULT 0,
  is_system_account BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  UNIQUE(tenant_id, code)
);

CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- trip, expense, payment, etc
  reference_id INTEGER,
  posted_by VARCHAR(255) NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);

CREATE TABLE journal_lines (
  id SERIAL PRIMARY KEY,
  journal_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
  debit_paisa NUMERIC(14,2),
  credit_paisa NUMERIC(14,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INVOICING & PAYMENTS
-- ============================================================================

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_number VARCHAR(50) NOT NULL,
  amount_paisa NUMERIC(14,2) NOT NULL,
  tax_label VARCHAR(100),
  tax_paisa NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(50), -- unpaid, partial, paid
  invoice_date DATE NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  UNIQUE(tenant_id, invoice_number)
);

CREATE TABLE inbound_payments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  payment_date DATE NOT NULL,
  amount_paisa NUMERIC(14,2) NOT NULL,
  method VARCHAR(50), -- bank_transfer, cash, cheque
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- ============================================================================
-- PAYABLES & OUTBOUND PAYMENTS
-- ============================================================================

CREATE TABLE carrier_payables (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  carrier_id INTEGER NOT NULL REFERENCES carriers(id),
  pay_type VARCHAR(50), -- flat_rate, cost_plus
  base_paisa NUMERIC(14,2),
  status VARCHAR(50) DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE outbound_payments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_type VARCHAR(50), -- payable, vendor, advance
  reference_id INTEGER,
  payment_date DATE NOT NULL,
  amount_paisa NUMERIC(14,2) NOT NULL,
  method VARCHAR(50), -- bank_transfer, cash, cheque
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- ============================================================================
-- VENDOR TRANSACTIONS & AGENT CHARGES
-- ============================================================================

CREATE TABLE vendor_transactions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  description TEXT,
  amount_paisa NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_charges (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES clearing_agents(id),
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  charge_type VARCHAR(50), -- noc, clearance, other
  amount_paisa NUMERIC(14,2) NOT NULL,
  reference_no VARCHAR(100),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CLAIMS
-- ============================================================================

CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  type VARCHAR(50), -- damage, loss, delay
  description TEXT,
  amount_paisa NUMERIC(14,2),
  status VARCHAR(50), -- open, investigating, settled, rejected
  cost_bearer VARCHAR(50), -- carrier, vendor, other
  reported_by VARCHAR(255),
  date DATE NOT NULL,
  resolution TEXT,
  linked_items JSONB, -- checklist item indices
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- JOURNEYS (Multi-trip runs)
-- ============================================================================

CREATE TABLE journeys (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trip_no VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  carrier_id INTEGER NOT NULL REFERENCES carriers(id),
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  route_from VARCHAR(100),
  route_to VARCHAR(100),
  stations JSONB, -- array of cities
  status VARCHAR(50), -- open, finished
  date_end DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP NULL
);

-- ============================================================================
-- EMPLOYEE ADVANCES
-- ============================================================================

CREATE TABLE employee_advances (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  amount_paisa NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  advance_type VARCHAR(50), -- cash_advance, prepay
  status VARCHAR(50) DEFAULT 'open', -- open, deducted, cancelled
  deducted_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- ============================================================================
-- SETTINGS & CONFIGURATION
-- ============================================================================

CREATE TABLE tenant_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  gemini_api_key VARCHAR(500),
  session_timeout_minutes INTEGER DEFAULT 30,
  currency VARCHAR(10) DEFAULT 'PKR',
  locale VARCHAR(10) DEFAULT 'ur-PK',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDICES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_carriers_tenant ON carriers(tenant_id);
CREATE INDEX idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(is_active) WHERE is_active = true;

-- ============================================================================
-- PERMISSIONS: All tables have tenant_id, enforced at application level
-- ============================================================================
-- The application layer uses:
-- 1. TenantInterceptor to auto-inject tenant_id into all queries
-- 2. PermissionGuard to check user's role before allowing access
-- 3. Row-level scoping: drivers see own trips only via driver_id FK
-- ============================================================================
