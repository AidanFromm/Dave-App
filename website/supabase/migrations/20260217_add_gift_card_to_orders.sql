-- Add gift card columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_code TEXT;
