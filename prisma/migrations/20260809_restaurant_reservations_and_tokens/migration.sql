-- Restaurant Domain: Reservations + Token Number
-- Migration: 20260809_restaurant_reservations_and_tokens

-- 1. Restaurant Reservations table
CREATE TABLE IF NOT EXISTS restaurant_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(200),
  party_size INT NOT NULL DEFAULT 2,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  duration INT NOT NULL DEFAULT 90,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  source VARCHAR(20) DEFAULT 'manual',
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_business ON restaurant_reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_date ON restaurant_reservations(business_id, date);
CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_status ON restaurant_reservations(business_id, status);

-- 2. Token number on orders (daily-resetting counter)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_orders' AND column_name = 'token_number'
  ) THEN
    ALTER TABLE restaurant_orders ADD COLUMN token_number INT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_token ON restaurant_orders(business_id, created_at, token_number);
