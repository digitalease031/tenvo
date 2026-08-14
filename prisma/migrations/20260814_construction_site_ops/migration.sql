-- Construction Site Operations Tables Migration
-- Date: 2026-08-14
-- Purpose: Add site operations tracking tables (daily reports, safety, quality, inspections)

-- ============================================================================
-- Daily Work Reports Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS construction_daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  report_date DATE NOT NULL,
  weather_conditions VARCHAR(255),
  manpower_on_site INTEGER,
  work_description TEXT NOT NULL,
  equipment_deployed TEXT,
  materials_consumed TEXT,
  progress_pct DECIMAL(5, 2),
  issues_encountered TEXT,
  remarks TEXT,
  reported_by VARCHAR(255),
  domain_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_daily_reports_business FOREIGN KEY (business_id)
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_daily_reports_project FOREIGN KEY (project_id)
    REFERENCES construction_projects(id) ON DELETE CASCADE,
  CONSTRAINT unique_daily_report_date UNIQUE (project_id, report_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_reports_business ON construction_daily_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON construction_daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON construction_daily_reports(report_date);

-- ============================================================================
-- Safety Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS construction_safety_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  log_date DATE NOT NULL,
  incident_type VARCHAR(50) NOT NULL, -- NEAR_MISS, INJURY, EQUIPMENT_FAILURE, SAFETY_VIOLATION, INSPECTION, OTHER
  severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  description TEXT NOT NULL,
  location_station VARCHAR(255),
  corrective_action TEXT,
  responsible_person VARCHAR(255),
  status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
  logged_by VARCHAR(255),
  domain_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_safety_logs_business FOREIGN KEY (business_id)
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_safety_logs_project FOREIGN KEY (project_id)
    REFERENCES construction_projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_logs_business ON construction_safety_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_safety_logs_project ON construction_safety_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_logs_date ON construction_safety_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_safety_logs_severity ON construction_safety_logs(severity);
CREATE INDEX IF NOT EXISTS idx_safety_logs_status ON construction_safety_logs(status);

-- ============================================================================
-- Quality Tests Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS construction_quality_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  test_date DATE NOT NULL,
  test_type VARCHAR(255) NOT NULL, -- e.g. "Concrete Cube Test", "Soil Compaction", "Rebar Tensile"
  test_standard VARCHAR(100), -- e.g. "ASTM C39", "AASHTO T99", "BS 1881"
  sample_location VARCHAR(255),
  test_results TEXT NOT NULL,
  pass_fail_status VARCHAR(20) NOT NULL, -- PASS, FAIL, PENDING, CONDITIONAL
  tested_by VARCHAR(255),
  remarks TEXT,
  domain_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_quality_tests_business FOREIGN KEY (business_id)
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_quality_tests_project FOREIGN KEY (project_id)
    REFERENCES construction_projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quality_tests_business ON construction_quality_tests(business_id);
CREATE INDEX IF NOT EXISTS idx_quality_tests_project ON construction_quality_tests(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_tests_date ON construction_quality_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_quality_tests_status ON construction_quality_tests(pass_fail_status);

-- ============================================================================
-- Site Inspections Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS construction_site_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  project_id UUID NOT NULL,
  inspection_date DATE NOT NULL,
  inspection_type VARCHAR(50) NOT NULL, -- PROGRESS, QUALITY, SAFETY, CLIENT, ENGINEER, FINAL
  inspector_name VARCHAR(255) NOT NULL,
  findings TEXT NOT NULL,
  recommendations TEXT,
  compliance_status VARCHAR(20) NOT NULL, -- COMPLIANT, NON_COMPLIANT, CONDITIONAL
  follow_up_required BOOLEAN DEFAULT false,
  next_inspection_date DATE,
  domain_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_site_inspections_business FOREIGN KEY (business_id)
    REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_site_inspections_project FOREIGN KEY (project_id)
    REFERENCES construction_projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_inspections_business ON construction_site_inspections(business_id);
CREATE INDEX IF NOT EXISTS idx_site_inspections_project ON construction_site_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_site_inspections_date ON construction_site_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_site_inspections_type ON construction_site_inspections(inspection_type);
CREATE INDEX IF NOT EXISTS idx_site_inspections_compliance ON construction_site_inspections(compliance_status);

