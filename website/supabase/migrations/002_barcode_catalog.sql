CREATE TABLE IF NOT EXISTS barcode_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  barcode_type TEXT NOT NULL DEFAULT 'UPC',
  stockx_product_id TEXT,
  stockx_variant_id TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  colorway TEXT,
  style_id TEXT,
  size TEXT,
  retail_price NUMERIC(10,2),
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  product_type TEXT NOT NULL DEFAULT 'sneaker',
  scan_count INT NOT NULL DEFAULT 1,
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast barcode lookups
CREATE INDEX IF NOT EXISTS idx_barcode_catalog_barcode ON barcode_catalog(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_catalog_style_id ON barcode_catalog(style_id);

-- RLS: Admin users can read/insert/update
ALTER TABLE barcode_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read barcode_catalog"
  ON barcode_catalog FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Admin users can insert barcode_catalog"
  ON barcode_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Admin users can update barcode_catalog"
  ON barcode_catalog FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
      AND profiles.role IN ('owner', 'manager', 'staff')
    )
  );
