-- Migration: Add refund and pickup columns to orders table
-- Run this in Supabase SQL Editor

-- Delivery method: 'shipping' or 'pickup'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'shipping';

-- Pickup status tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_status text DEFAULT NULL;

-- Refund tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason text DEFAULT NULL;

-- Customer phone (for SMS notifications)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text DEFAULT NULL;

-- Backfill delivery_method from fulfillment_type for existing orders
UPDATE orders SET delivery_method = 'pickup' WHERE fulfillment_type = 'pickup' AND delivery_method IS NULL;
UPDATE orders SET delivery_method = 'shipping' WHERE delivery_method IS NULL;

-- Set pickup_status for existing pickup orders
UPDATE orders SET pickup_status = 'pending' WHERE delivery_method = 'pickup' AND pickup_status IS NULL AND status NOT IN ('delivered', 'cancelled', 'refunded');
