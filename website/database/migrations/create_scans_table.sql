-- Real-time phone-to-desktop barcode scanner system
-- Table: scans

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upc TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  suggested_price NUMERIC,
  final_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'priced', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE
);

-- Index for querying by user and status
CREATE INDEX idx_scans_user_status ON scans (user_id, status);
CREATE INDEX idx_scans_created_at ON scans (created_at DESC);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own rows
CREATE POLICY "Users can insert their own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON scans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON scans FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE scans;
