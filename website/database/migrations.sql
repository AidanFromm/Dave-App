-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Drop notification subscribers  
CREATE TABLE IF NOT EXISTS drop_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anonymous users (public forms)
CREATE POLICY "Allow public inserts" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public subscribe" ON drop_subscribers FOR INSERT WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated read contacts" ON contact_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read subscribers" ON drop_subscribers FOR SELECT USING (auth.role() = 'authenticated');
