-- Visitor tracking table for admin analytics
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS visitor_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  country text,
  country_code text,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  device_type text DEFAULT 'Desktop',
  user_agent text,
  page_path text NOT NULL,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON visitor_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created ON visitor_logs(created_at DESC);

ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON visitor_logs
  FOR ALL
  USING (true);
