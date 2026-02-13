-- Fix 1: Orders RLS — restrict customers to only see their own orders
DROP POLICY IF EXISTS "Users can view orders by email" ON orders;

-- Customers can only see orders matching their email (from auth.jwt())
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    customer_email = (auth.jwt() ->> 'email')
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Allow service_role to insert orders (for webhook)
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
CREATE POLICY "Service role can manage orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Fix 2: Update inventory_adjustments source CHECK to include 'stripe_webhook' 
-- and allow service_role inserts
ALTER TABLE inventory_adjustments DROP CONSTRAINT IF EXISTS inventory_adjustments_source_check;
ALTER TABLE inventory_adjustments ADD CONSTRAINT inventory_adjustments_source_check 
  CHECK (source IN ('admin', 'clover_webhook', 'web_order', 'stripe_webhook'));

-- Allow adjusted_by to be NULL (for system/webhook actions)
ALTER TABLE inventory_adjustments ALTER COLUMN adjusted_by DROP NOT NULL;

-- Service role policy for inventory_adjustments
CREATE POLICY "Service role can manage inventory_adjustments" ON inventory_adjustments
  FOR ALL USING (auth.role() = 'service_role');
