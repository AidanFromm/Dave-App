-- ============================================================
-- Product Variants Migration
-- Run this on Supabase SQL Editor
-- ============================================================

-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  condition TEXT NOT NULL DEFAULT 'DS' CHECK (condition IN ('DS', 'VNDS', 'Used-Excellent', 'Used-Good', 'Used-Fair')),
  sku TEXT UNIQUE,
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  quantity INTEGER NOT NULL DEFAULT 0,
  clover_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookups
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public read access (for shop)
CREATE POLICY "Public can read variants" ON product_variants
  FOR SELECT USING (true);

-- Authenticated users with admin role can manage
CREATE POLICY "Admins can manage variants" ON product_variants
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Add has_variants flag to products table (optional helper)
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false;
