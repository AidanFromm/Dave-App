-- Drop Subscribers table for email notifications
CREATE TABLE IF NOT EXISTS drop_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  drop_id UUID NOT NULL,
  product_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, drop_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drop_subscribers_drop_id ON drop_subscribers(drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_subscribers_email ON drop_subscribers(email);

-- Enable RLS
ALTER TABLE drop_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for notification signups)
CREATE POLICY "Allow public to subscribe" ON drop_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to read (for admin)
CREATE POLICY "Allow authenticated to read" ON drop_subscribers
  FOR SELECT
  TO authenticated
  USING (true);
