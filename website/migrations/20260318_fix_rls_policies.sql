-- Fix RLS for drops table (Scheduled_drops)
DROP POLICY IF EXISTS "Service role full access on drops" ON drops;

-- Allow everyone to view active drops
CREATE POLICY "Anyone can view active drops" ON drops
  FOR SELECT USING (is_active = true);

-- Allow admins and service role to manage drops
CREATE POLICY "Admin and service role can manage drops" ON drops
  FOR ALL USING (is_admin_user() OR auth.role() = 'service_role');


-- Fix RLS for drop_subscribers table
DROP POLICY IF EXISTS "Allow authenticated to read" ON drop_subscribers;

-- Allow admins and service role to read drop_subscribers
CREATE POLICY "Admin and service role can read drop subscribers" ON drop_subscribers
  FOR SELECT USING (is_admin_user() OR auth.role() = 'service_role');