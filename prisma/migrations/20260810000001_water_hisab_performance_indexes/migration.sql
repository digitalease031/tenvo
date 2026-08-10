-- Water Hisab Performance Indexes
-- Fixes slow queries in getWaterHisabDayAction and getWaterHisabPeriodSummaryAction
-- SAFE: Uses IF NOT EXISTS and checks for existing indexes before creating

-- ==========================================
-- EXISTING INDEXES (Already in schema.prisma):
-- ==========================================
-- idx_water_delivery_stops_business_date (business_id, delivery_date)
-- idx_water_delivery_stops_business_customer (business_id, customer_id)
-- idx_water_delivery_lines_business_product (business_id, product_id)
-- water_delivery_stops_business_date_customer_key UNIQUE (business_id, delivery_date, customer_id)

-- ==========================================
-- NEW INDEXES TO ADD:
-- ==========================================

-- 1. Partial index for active stops (adds is_deleted filter to existing index)
-- Speeds up: getWaterHisabDayAction line 217-226
-- Note: Complements existing idx_water_delivery_stops_business_date
CREATE INDEX IF NOT EXISTS idx_water_stops_business_date_active 
ON water_delivery_stops (business_id, delivery_date DESC)
WHERE is_deleted = false;

-- 2. Composite index for period range queries with sort optimization
-- Speeds up: getWaterHisabPeriodSummaryAction line 805-820
-- Uses DESC for efficient date range scans
CREATE INDEX IF NOT EXISTS idx_water_stops_period_range 
ON water_delivery_stops (business_id, delivery_date DESC, customer_id)
WHERE is_deleted = false;

-- 3. Index for invoice notes pattern matching (water hisab invoices only)
-- Speeds up: getWaterHisabPeriodSummaryAction line 822-833
-- Creates pg_trgm extension if needed for fast LIKE queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE EXTENSION pg_trgm;
  END IF;
END
$$;

-- Partial GIN index for water hisab invoices only
CREATE INDEX IF NOT EXISTS idx_invoices_water_hisab_notes 
ON invoices USING gin (notes gin_trgm_ops)
WHERE is_deleted = false 
  AND notes LIKE '%water_hisab_period%';

-- 4. Partial index for active water customers (complements general customer indexes)
-- Speeds up: getWaterHisabDayAction line 210-216 customer filtering
-- Only indexes active customers to keep index size small
CREATE INDEX IF NOT EXISTS idx_customers_water_active 
ON customers (business_id, name)
WHERE is_deleted = false AND is_active = true;

-- ==========================================
-- ANALYZE TABLES (Update query planner stats)
-- ==========================================
ANALYZE water_delivery_stops;
ANALYZE water_delivery_lines;
ANALYZE invoices;
ANALYZE customers;

-- ==========================================
-- VERIFICATION QUERIES (Run after migration)
-- ==========================================
-- Check all water_delivery_stops indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'water_delivery_stops' ORDER BY indexname;
--
-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('water_delivery_stops', 'invoices', 'customers')
-- ORDER BY tablename, idx_scan DESC;
