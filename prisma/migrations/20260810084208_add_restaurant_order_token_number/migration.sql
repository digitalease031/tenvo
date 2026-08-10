-- Add token_number column to restaurant_orders for daily token sequence
ALTER TABLE restaurant_orders 
ADD COLUMN IF NOT EXISTS token_number INT;

-- Create index for efficient daily token sequence lookup
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_token_lookup 
ON restaurant_orders(business_id, created_at, token_number) 
WHERE token_number IS NOT NULL;

-- Add comment
COMMENT ON COLUMN restaurant_orders.token_number IS 'Daily sequence number (1, 2, 3...) resets each day for kitchen display';
