-- Secured App Realtime & Storage Setup
-- Run this AFTER 002_row_level_security.sql

-- ============================================
-- ENABLE REALTIME
-- This allows instant inventory updates across all clients
-- ============================================

-- Enable realtime for products table (most critical for inventory sync)
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Enable realtime for orders (for admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for scheduled drops (for countdown updates)
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_drops;

-- ============================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================

-- Create the bucket (run this, then configure in Dashboard if needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public bucket for product images
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Anyone can view product images
CREATE POLICY "Product images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only service role can upload/modify images
CREATE POLICY "Only admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'service_role');

CREATE POLICY "Only admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'service_role');

CREATE POLICY "Only admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for: products, orders, scheduled_drops';
  RAISE NOTICE 'Storage bucket created: product-images';
END $$;
