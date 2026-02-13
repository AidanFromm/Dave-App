-- Discounts / Promo Codes table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  min_order NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  uses INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add discount_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT DEFAULT NULL;

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts (code);
