-- Add pickup_code column to orders table for in-store pickup verification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code TEXT;

-- Index for quick lookup by pickup code
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders (pickup_code) WHERE pickup_code IS NOT NULL;
