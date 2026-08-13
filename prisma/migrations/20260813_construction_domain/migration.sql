-- Construction Domain Schema Migration
-- Date: 2026-08-13
-- Purpose: Add construction project management tables for construction-contractor domain

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Construction Projects Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS construction_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_contact VARCHAR(100),
  contractor_category VARCHAR(20) DEFAULT 'C-1', -- C-A, C-B, C-1 to C-6
  contract_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  commencement_date DATE NOT NULL,
  completion_date DATE NOT NULL,
  province_code VARCHAR(10) DEFAULT 'PK-PB', -- PK-PB, PK-SD, PK-KP, PK-BA
  is_government_project BOOLEAN DEFAULT false,
  pec_project_no VARCHAR(100),
  ppra_reference VARCHAR(100),
  employer_dept VARCHAR(255), -- e.g. NHA, CWD, LDA, MDA
  
  -- Financial tracking
  mobilization_adv_pct DECIMAL(5, 2) DEFAULT 10.0,
  retention_pct DECIMAL(5, 2) DEFAULT 5.0,
  cumulative_certified DECIMAL(15, 2) DEFAULT 0,
  cumulative_paid DECIMAL(15, 2) DEFAULT 0,
  retention_held DECIMAL(15, 2) DEFAULT 0,
  mobilization_recovered DECIMAL(15, 2) DEFAULT 0,
  
  -- Status & workflow
  status VARCHAR(20) DEFAULT 'ACTIVE', -- BIDDING, ACTIVE, DLP, CLOSED, CANCELLED
  completion_pct DECIMAL(5, 2) DEFAULT 0,
  
  -- Notes & metadata
  notes TEXT,
  domain_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT fk_construction_projects_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT unique_construction_project_code UNIQUE (business_id, code),
  CONSTRAINT check_contract_value_positive CHECK (contract_value >= 0),
  CONSTRAINT check_completion_pct_range CHECK (completion_pct >= 0 AND completion_pct <= 100),
  CONSTRAINT check_mobilization_adv_pct_range CHECK (mobilization_adv_pct >= 0 AND mobilization_adv_pct <= 100),
  CONSTRAINT check_retention_pct_range CHECK (retention_pct >= 0 AND retention_pct <= 100)
);

-- Indexes for construction_projects
CREATE INDEX idx_construction_projects_business ON construction_projects(business_id);
CREATE INDEX idx_construction_projects_status ON construction_projects(business_id, status);
CREATE INDEX idx_construction_projects_dates ON construction_projects(business_id, commencement_date, completion_date);
CREATE INDEX idx_construction_projects_domain_data ON construction_projects USING GIN (domain_data);

-- ============================================================================
-- Bill of Quantities (BOQ) Items Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bill_of_quantities_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  item_no VARCHAR(50) NOT NULL, -- e.g. BOQ-3.1
  description TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL, -- Cu.M, Ton, Sq.Ft, etc.
  
  -- Estimated quantities
  estimated_qty DECIMAL(15, 3) NOT NULL DEFAULT 0,
  estimated_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estimated_total DECIMAL(15, 2) GENERATED ALWAYS AS (estimated_qty * estimated_rate) STORED,
  
  -- Actual quantities
  actual_qty DECIMAL(15, 3) DEFAULT 0,
  actual_rate DECIMAL(12, 2),
  actual_total DECIMAL(15, 2) GENERATED ALWAYS AS (actual_qty * COALESCE(actual_rate, estimated_rate)) STORED,
  
  -- Schedule of Rates reference
  schedule_code VARCHAR(50), -- e.g. MRS-PUNJAB-14.2
  sor_reference VARCHAR(100), -- Full SOR reference
  
  -- Composite rate breakdown
  material_cost_ratio DECIMAL(5, 3) DEFAULT 0.600, -- 60% material
  labor_cost_ratio DECIMAL(5, 3) DEFAULT 0.250, -- 25% labor
  machinery_cost_ratio DECIMAL(5, 3) DEFAULT 0.100, -- 10% machinery
  overhead_ratio DECIMAL(5, 3) DEFAULT 0.050, -- 5% overhead
  
  -- Location & phase
  location_station VARCHAR(255), -- e.g. "KM 14+200 Stockpile Yard"
  work_phase VARCHAR(100), -- e.g. "Foundation", "Superstructure", "Finishing"
  
  -- Metadata
  specification_grade TEXT, -- e.g. "ASTM A615 Grade 60"
  notes TEXT,
  domain_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_boq_items_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_boq_items_project FOREIGN KEY (project_id) 
    REFERENCES construction_projects(id) ON DELETE CASCADE,
  CONSTRAINT unique_boq_item_no UNIQUE (project_id, item_no),
  CONSTRAINT check_boq_estimated_qty_positive CHECK (estimated_qty >= 0),
  CONSTRAINT check_boq_actual_qty_nonnegative CHECK (actual_qty >= 0),
  CONSTRAINT check_boq_ratios_sum CHECK (
    material_cost_ratio + labor_cost_ratio + machinery_cost_ratio + overhead_ratio <= 1.0
  )
);

-- Indexes for bill_of_quantities_items
CREATE INDEX idx_boq_items_business ON bill_of_quantities_items(business_id);
CREATE INDEX idx_boq_items_project ON bill_of_quantities_items(project_id);
CREATE INDEX idx_boq_items_project_item_no ON bill_of_quantities_items(project_id, item_no);
CREATE INDEX idx_boq_items_domain_data ON bill_of_quantities_items USING GIN (domain_data);

-- ============================================================================
-- Interim Payment Certificates (IPC) Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS interim_payment_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  ipc_number INT NOT NULL,
  ipc_code VARCHAR(20), -- e.g. "IPC-01"
  
  -- Period
  period_starting DATE,
  period_ending DATE NOT NULL,
  
  -- Gross certified amount
  gross_certified_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  this_ipc_gross DECIMAL(15, 2) NOT NULL DEFAULT 0, -- This IPC only (not cumulative)
  
  -- Adjustments
  escalation_amount DECIMAL(15, 2) DEFAULT 0, -- PEC Clause 70
  secured_advance DECIMAL(15, 2) DEFAULT 0, -- Advance on site materials
  
  -- Deductions
  retention_deduction DECIMAL(15, 2) DEFAULT 0,
  mobilization_recovery DECIMAL(15, 2) DEFAULT 0,
  
  -- Tax deductions
  net_before_tax DECIMAL(15, 2) DEFAULT 0,
  wht_rate DECIMAL(5, 2) DEFAULT 7.5, -- FBR WHT Section 153(1)(c)
  wht_deduction DECIMAL(15, 2) DEFAULT 0,
  provincial_tax_rate DECIMAL(5, 2) DEFAULT 5.0, -- PRA, SRB, KPRA, BRA
  provincial_tax_label VARCHAR(50), -- e.g. "PRA 5%"
  provincial_tax_deduction DECIMAL(15, 2) DEFAULT 0,
  
  -- Net payable
  net_payable DECIMAL(15, 2) DEFAULT 0,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'SUBMITTED', -- SUBMITTED, VERIFIED, APPROVED, DISBURSED, REJECTED
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  disbursed_at TIMESTAMPTZ,
  disbursement_reference VARCHAR(100),
  
  -- Notes
  notes TEXT,
  engineer_remarks TEXT,
  contractor_remarks TEXT,
  domain_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT fk_ipcs_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_ipcs_project FOREIGN KEY (project_id) 
    REFERENCES construction_projects(id) ON DELETE CASCADE,
  CONSTRAINT unique_ipc_number UNIQUE (project_id, ipc_number),
  CONSTRAINT check_ipc_number_positive CHECK (ipc_number > 0),
  CONSTRAINT check_ipc_gross_positive CHECK (gross_certified_amount >= 0)
);

-- Indexes for interim_payment_certificates
CREATE INDEX idx_ipcs_business ON interim_payment_certificates(business_id);
CREATE INDEX idx_ipcs_project ON interim_payment_certificates(project_id);
CREATE INDEX idx_ipcs_project_number ON interim_payment_certificates(project_id, ipc_number);
CREATE INDEX idx_ipcs_status ON interim_payment_certificates(business_id, status);
CREATE INDEX idx_ipcs_period_ending ON interim_payment_certificates(business_id, period_ending DESC);
CREATE INDEX idx_ipcs_domain_data ON interim_payment_certificates USING GIN (domain_data);

-- ============================================================================
-- Machinery & Equipment Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS machinery_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID, -- Optional: can log machinery hours without project link
  
  -- Equipment identification
  machinery_code VARCHAR(50) NOT NULL, -- e.g. "EQ-01"
  machinery_name VARCHAR(255) NOT NULL, -- e.g. "Excavator CAT 320"
  equipment_type VARCHAR(100), -- e.g. "Excavator", "Grader", "Paver"
  
  -- Operator
  operator_name VARCHAR(255) NOT NULL,
  operator_id VARCHAR(100),
  
  -- Hour meter readings
  start_hours DECIMAL(10, 2) NOT NULL,
  end_hours DECIMAL(10, 2) NOT NULL,
  hours_worked DECIMAL(10, 2) GENERATED ALWAYS AS (end_hours - start_hours) STORED,
  
  -- Fuel tracking
  fuel_litres DECIMAL(10, 2) DEFAULT 0,
  fuel_per_hour DECIMAL(10, 3) GENERATED ALWAYS AS (
    CASE 
      WHEN (end_hours - start_hours) > 0 THEN fuel_litres / (end_hours - start_hours)
      ELSE 0
    END
  ) STORED,
  
  -- Output tracking
  output_qty DECIMAL(15, 3) DEFAULT 0, -- e.g. 250 Cu.M excavated
  output_unit VARCHAR(20), -- Cu.M, Ton, Sq.M
  output_per_hour DECIMAL(10, 3) GENERATED ALWAYS AS (
    CASE 
      WHEN (end_hours - start_hours) > 0 THEN output_qty / (end_hours - start_hours)
      ELSE 0
    END
  ) STORED,
  
  -- Location & work description
  location_station VARCHAR(255), -- e.g. "KM 18+500"
  work_description TEXT,
  boq_item_ref VARCHAR(50), -- Reference to BOQ item if applicable
  
  -- Date
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift VARCHAR(20), -- Morning, Evening, Night
  
  -- Maintenance flags
  maintenance_required BOOLEAN DEFAULT false,
  maintenance_notes TEXT,
  
  -- Metadata
  notes TEXT,
  domain_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT fk_machinery_logs_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_machinery_logs_project FOREIGN KEY (project_id) 
    REFERENCES construction_projects(id) ON DELETE SET NULL,
  CONSTRAINT check_machinery_end_hours_greater CHECK (end_hours >= start_hours),
  CONSTRAINT check_machinery_fuel_nonnegative CHECK (fuel_litres >= 0),
  CONSTRAINT check_machinery_output_nonnegative CHECK (output_qty >= 0)
);

-- Indexes for machinery_logs
CREATE INDEX idx_machinery_logs_business ON machinery_logs(business_id);
CREATE INDEX idx_machinery_logs_project ON machinery_logs(project_id);
CREATE INDEX idx_machinery_logs_business_date ON machinery_logs(business_id, log_date DESC);
CREATE INDEX idx_machinery_logs_project_date ON machinery_logs(project_id, log_date DESC);
CREATE INDEX idx_machinery_logs_machinery_code ON machinery_logs(business_id, machinery_code, log_date DESC);
CREATE INDEX idx_machinery_logs_domain_data ON machinery_logs USING GIN (domain_data);

-- ============================================================================
-- Subcontractor Work Orders Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subcontractor_work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  vendor_id UUID, -- References vendors table
  
  -- Work order identification
  work_order_no VARCHAR(50) NOT NULL,
  work_order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Subcontractor details
  subcontractor_name VARCHAR(255) NOT NULL,
  subcontractor_category VARCHAR(50), -- e.g. "Steel Fixers", "Masons"
  pec_license_no VARCHAR(100),
  specialization_code VARCHAR(50),
  
  -- Financial
  work_order_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  retainage_pct DECIMAL(5, 2) DEFAULT 10.0,
  
  -- Tracking
  amount_certified DECIMAL(15, 2) DEFAULT 0,
  retainage_deducted DECIMAL(15, 2) DEFAULT 0,
  amount_released DECIMAL(15, 2) DEFAULT 0, -- Retainage released after DLP
  net_paid DECIMAL(15, 2) DEFAULT 0,
  completion_pct DECIMAL(5, 2) DEFAULT 0,
  
  -- DLP (Defects Liability Period)
  dlp_status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, DLP_STARTED, DLP_COMPLETED, RELEASED
  dlp_months INT DEFAULT 12,
  dlp_start_date DATE,
  dlp_end_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
  
  -- Notes
  scope_of_work TEXT,
  notes TEXT,
  domain_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT fk_subcontractor_wo_business FOREIGN KEY (business_id) 
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_subcontractor_wo_project FOREIGN KEY (project_id) 
    REFERENCES construction_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_subcontractor_wo_vendor FOREIGN KEY (vendor_id) 
    REFERENCES vendors(id) ON DELETE SET NULL,
  CONSTRAINT unique_work_order_no UNIQUE (business_id, work_order_no),
  CONSTRAINT check_subcontractor_wo_value_positive CHECK (work_order_value >= 0),
  CONSTRAINT check_subcontractor_retainage_pct_range CHECK (retainage_pct >= 0 AND retainage_pct <= 100),
  CONSTRAINT check_subcontractor_completion_pct_range CHECK (completion_pct >= 0 AND completion_pct <= 100)
);

-- Indexes for subcontractor_work_orders
CREATE INDEX idx_subcontractor_wo_business ON subcontractor_work_orders(business_id);
CREATE INDEX idx_subcontractor_wo_project ON subcontractor_work_orders(project_id);
CREATE INDEX idx_subcontractor_wo_vendor ON subcontractor_work_orders(vendor_id);
CREATE INDEX idx_subcontractor_wo_status ON subcontractor_work_orders(business_id, status);
CREATE INDEX idx_subcontractor_wo_domain_data ON subcontractor_work_orders USING GIN (domain_data);

-- ============================================================================
-- Add construction relations to businesses table
-- ============================================================================
-- Note: Relations are handled by Prisma schema, no SQL needed here

-- ============================================================================
-- Grant permissions (if using RLS or specific roles)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON construction_projects TO tenvo_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON bill_of_quantities_items TO tenvo_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON interim_payment_certificates TO tenvo_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON machinery_logs TO tenvo_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON subcontractor_work_orders TO tenvo_app_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE construction_projects IS 'Construction project registry with PEC/PPRA compliance tracking';
COMMENT ON TABLE bill_of_quantities_items IS 'BOQ line items with MRS/CSR schedule codes and composite rate analysis';
COMMENT ON TABLE interim_payment_certificates IS 'IPC running bills with mobilization advance recovery, retention, and tax deductions';
COMMENT ON TABLE machinery_logs IS 'Heavy equipment daily logbook with hour-meter, fuel, and output tracking';
COMMENT ON TABLE subcontractor_work_orders IS 'Subcontractor work orders with retainage and DLP tracking';

COMMENT ON COLUMN construction_projects.contractor_category IS 'PEC Contractor Category: C-A (No Limit), C-B, C-1 to C-6';
COMMENT ON COLUMN construction_projects.province_code IS 'Province code for tax jurisdiction: PK-PB (Punjab), PK-SD (Sindh), PK-KP (KP), PK-BA (Balochistan)';
COMMENT ON COLUMN bill_of_quantities_items.schedule_code IS 'Schedule of Rates reference code (e.g. MRS-PUNJAB-14.2, CSR-NHA-401B)';
COMMENT ON COLUMN interim_payment_certificates.wht_rate IS 'FBR Withholding Tax rate under Section 153(1)(c) - typically 7.5% for companies, 8% for non-companies';
COMMENT ON COLUMN interim_payment_certificates.provincial_tax_rate IS 'Provincial sales tax rate (PRA 5%, SRB 13%, KPRA 15%, BRA 15%)';
