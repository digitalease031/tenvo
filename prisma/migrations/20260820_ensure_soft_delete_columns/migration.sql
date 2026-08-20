-- ============================================================
-- Migration: Ensure soft-delete columns across all hub tables
-- Date: 2026-08-20
-- Adds is_deleted / is_active where missing, with safe defaults.
-- All statements use IF NOT EXISTS / DO blocks — fully idempotent.
-- ============================================================

-- invoices: missing is_active
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- invoice_items: missing is_deleted, is_active
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- purchases: missing is_active
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- purchase_items: missing is_deleted, is_active
ALTER TABLE purchase_items
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- expenses: missing is_active
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- payments: missing is_active
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- pos_transactions: missing is_deleted, is_active
ALTER TABLE pos_transactions
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- quotations: missing is_active
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- credit_notes: missing is_deleted, is_active
ALTER TABLE credit_notes
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- journal_entries: missing is_deleted, is_active
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- gl_accounts: missing is_deleted
ALTER TABLE gl_accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- stock_movements: missing is_deleted, is_active
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- product_serials: missing is_active
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- warehouse_locations: missing is_deleted
ALTER TABLE warehouse_locations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- pos_sessions: missing is_deleted, is_active
ALTER TABLE pos_sessions
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- pos_terminals: missing is_deleted, is_active
ALTER TABLE pos_terminals
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- sales_orders: missing is_active
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- delivery_challans: missing is_active
ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- purchase_returns: missing is_deleted, is_active
ALTER TABLE purchase_returns
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- invoice_payments: missing is_active
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- business_users: missing is_deleted, is_active
ALTER TABLE business_users
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- businesses: missing is_deleted
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- Useful indexes for soft-delete filter performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_business_deleted      ON invoices (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_purchases_business_deleted     ON purchases (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_expenses_business_deleted      ON expenses (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_payments_business_deleted      ON payments (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_quotations_business_deleted    ON quotations (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_business_deleted   ON gl_accounts (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_warehouse_deleted              ON warehouse_locations (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_pos_terminals_deleted          ON pos_terminals (business_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_businesses_deleted             ON businesses (is_deleted);
