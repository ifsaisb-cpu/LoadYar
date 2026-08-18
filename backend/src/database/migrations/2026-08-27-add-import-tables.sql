-- Phase 2.5 Week 2: Data Import & Migration Tables
-- Migration: Add import job tracking and error logging

BEGIN;

-- Import Jobs (track all import operations)
CREATE TABLE import_jobs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- customers, carriers, vehicles, rates, gl_accounts
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INTEGER, -- bytes
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, validating, importing, completed, failed
  total_rows INTEGER,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Import Errors (detailed error log per row)
CREATE TABLE import_errors (
  id SERIAL PRIMARY KEY,
  import_job_id INTEGER NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field_name VARCHAR(100),
  field_value TEXT,
  error_message TEXT NOT NULL,
  error_code VARCHAR(50), -- DUPLICATE, FORMAT, REQUIRED, INVALID_TYPE, FK_NOT_FOUND
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Import History (summary of all imports per tenant)
CREATE TABLE import_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  total_imports INTEGER DEFAULT 0,
  total_rows_imported INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  last_import_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, entity_type)
);

-- Indexes for performance
CREATE INDEX idx_import_jobs_tenant_status ON import_jobs(tenant_id, status);
CREATE INDEX idx_import_jobs_entity_type ON import_jobs(entity_type);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at DESC);
CREATE INDEX idx_import_errors_job_id ON import_errors(import_job_id);
CREATE INDEX idx_import_errors_row_number ON import_errors(row_number);
CREATE INDEX idx_import_history_tenant_type ON import_history(tenant_id, entity_type);

COMMIT;
