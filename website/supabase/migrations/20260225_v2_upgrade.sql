-- SecuredTampa V2 Upgrade Migration
-- Run this in Supabase SQL Editor

-- 1. Tickets system
CREATE TABLE IF NOT EXISTS tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email text NOT NULL,
  customer_name text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('order_issue', 'product_question', 'authentication', 'general')),
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_name text,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- 2. Visitors tracking
CREATE TABLE IF NOT EXISTS visitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip text,
  city text,
  country text,
  region text,
  latitude double precision,
  longitude double precision,
  page_path text,
  user_agent text,
  device_type text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip);

-- 3. Products: inventory location
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_location text DEFAULT 'store' CHECK (inventory_location IN ('store', 'warehouse'));

-- 4. Orders: payment method tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe' CHECK (payment_method IN ('cash', 'stripe', 'payment_link', 'gift_card'));

-- 5. RLS policies (permissive for now)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ticket_messages" ON ticket_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all visitors" ON visitors FOR ALL USING (true) WITH CHECK (true);
