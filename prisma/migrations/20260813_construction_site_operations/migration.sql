-- Construction Site Operations Schema Migration
-- Date: 2026-08-13
-- Purpose: Add daily reports, safety logs, quality tests, and site inspections tables

-- ============================================================
-- construction_daily_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_daily_reports (
  id                  UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id         UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  project_id          UUID        NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  report_date         DATE        NOT NULL,
  weather_conditions  VARCHAR(255),
  manpower_on_site    INTEGER,
  work_description    TEXT        NOT NULL,
  equipment_deployed  TEXT,
  materials_consumed  TEXT,
  progress_pct        NUMERIC(5,2),
  issues_encountered  TEXT,
  remarks             TEXT,
  reported_by         VARCHAR(255),
  domain_data         JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_progress_pct CHECK (progress_pct IS NULL OR (progress_pct >= 0 AND progress_pct <= 100)),
  CONSTRAINT unique_daily_report_date UNIQUE (project_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_report_business  ON construction_daily_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_daily_report_project   ON construction_daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_report_date      ON construction_daily_reports(business_id, report_date);
CREATE INDEX IF NOT EXISTS idx_daily_report_domain_data ON construction_daily_reports USING GIN(domain_data);

-- ============================================================
-- construction_safety_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_safety_logs (
  id                  UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id         UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  project_id          UUID        NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  log_date            DATE        NOT NULL,
  incident_type       VARCHAR(50) NOT NULL,
  severity            VARCHAR(20) NOT NULL DEFAULT 'LOW',
  description         TEXT        NOT NULL,
  location_station    VARCHAR(255),
  corrective_action   TEXT,
  responsible_person  VARCHAR(255),
  status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  logged_by           VARCHAR(255),
  domain_data         JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_safety_severity  CHECK (severity  IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT check_safety_status    CHECK (status    IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  CONSTRAINT check_safety_incident  CHECK (incident_type IN ('NEAR_MISS', 'INJURY', 'EQUIPMENT_FAILURE', 'SAFETY_VIOLATION', 'INSPECTION', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_safety_log_business         ON construction_safety_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_safety_log_project          ON construction_safety_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_log_severity_status  ON construction_safety_logs(business_id, severity, status);
CREATE INDEX IF NOT EXISTS idx_safety_log_date             ON construction_safety_logs(business_id, log_date);
CREATE INDEX IF NOT EXISTS idx_safety_log_domain_data      ON construction_safety_logs USING GIN(domain_data);

-- ============================================================
-- construction_quality_tests
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_quality_tests (
  id                  UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id         UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  project_id          UUID        NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  test_date           DATE        NOT NULL,
  test_type           VARCHAR(255) NOT NULL,
  test_standard       VARCHAR(100),
  sample_location     VARCHAR(255),
  test_results        TEXT        NOT NULL,
  pass_fail_status    VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  tested_by           VARCHAR(255),
  remarks             TEXT,
  domain_data         JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_quality_status CHECK (pass_fail_status IN ('PASS', 'FAIL', 'PENDING', 'CONDITIONAL'))
);

CREATE INDEX IF NOT EXISTS idx_quality_test_business  ON construction_quality_tests(business_id);
CREATE INDEX IF NOT EXISTS idx_quality_test_project   ON construction_quality_tests(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_test_status    ON construction_quality_tests(business_id, pass_fail_status);
CREATE INDEX IF NOT EXISTS idx_quality_test_date      ON construction_quality_tests(business_id, test_date);
CREATE INDEX IF NOT EXISTS idx_quality_test_domain_data ON construction_quality_tests USING GIN(domain_data);

-- ============================================================
-- construction_site_inspections
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_site_inspections (
  id                   UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id          UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  project_id           UUID        NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  inspection_date      DATE        NOT NULL,
  inspection_type      VARCHAR(50) NOT NULL,
  inspector_name       VARCHAR(255) NOT NULL,
  findings             TEXT        NOT NULL,
  recommendations      TEXT,
  compliance_status    VARCHAR(30) NOT NULL,
  follow_up_required   BOOLEAN     NOT NULL DEFAULT FALSE,
  next_inspection_date DATE,
  domain_data          JSONB       NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_inspection_type       CHECK (inspection_type IN ('PROGRESS', 'QUALITY', 'SAFETY', 'CLIENT', 'ENGINEER', 'FINAL')),
  CONSTRAINT check_compliance_status     CHECK (compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL'))
);

CREATE INDEX IF NOT EXISTS idx_site_inspection_business    ON construction_site_inspections(business_id);
CREATE INDEX IF NOT EXISTS idx_site_inspection_project     ON construction_site_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_site_inspection_compliance  ON construction_site_inspections(business_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_site_inspection_date        ON construction_site_inspections(business_id, inspection_date);
CREATE INDEX IF NOT EXISTS idx_site_inspection_domain_data ON construction_site_inspections USING GIN(domain_data);
