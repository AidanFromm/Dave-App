-- Product-level drops system: add drop columns to products table
-- Products flagged as drops are hidden from regular shop and only appear in Drops section

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS drop_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_quantity INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_starts_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_ends_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_sold_count INTEGER NOT NULL DEFAULT 0;

-- Index for efficient drop queries
CREATE INDEX IF NOT EXISTS idx_products_is_drop ON products(is_drop) WHERE is_drop = true;
CREATE INDEX IF NOT EXISTS idx_products_drop_starts_at ON products(drop_starts_at) WHERE is_drop = true;
CREATE INDEX IF NOT EXISTS idx_products_drop_ends_at ON products(drop_ends_at) WHERE is_drop = true;
