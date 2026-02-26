-- SecuredTampa V2 Upgrade Migration
-- Run in Supabase SQL Editor

-- 1. Tickets System
CREATE TABLE IF NOT EXISTS tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email text NOT NULL,
  customer_name text,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  sender_name text,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- 2. Visitors Table
CREATE TABLE IF NOT EXISTS visitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip text,
  city text,
  country text,
  region text,
  latitude float,
  longitude float,
  page_path text,
  user_agent text,
  device_type text,
  created_at timestamptz DEFAULT now()
);

-- 3. Add inventory_location to products (if not exists)
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN inventory_location text DEFAULT 'in_store';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Add payment_method to orders (if not exists)
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'stripe';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_visitors_country ON visitors(country);

-- 6. RLS policies (permissive for now)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ticket_messages" ON ticket_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all visitors" ON visitors FOR ALL USING (true) WITH CHECK (true);
