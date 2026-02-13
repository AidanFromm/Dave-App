-- Add shipping label columns to orders table for GoShippo integration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate NUMERIC(10,2);
-- tracking_number already exists; add if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
-- Shippo-specific metadata
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shippo_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shippo_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_history JSONB DEFAULT '[]'::jsonb;
