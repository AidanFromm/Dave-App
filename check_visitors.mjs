import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wupfvvwypyvzkznekksw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2OTMyMiwiZXhwIjoyMDg1NzQ1MzIyfQ.0dzNEm4ygSQUEUWuXQqXXzmsslvayB7xpXBWB1BTUVg'
);

// Check if table exists and has data
const { data, error, count } = await supabase.from('visitors').select('*', { count: 'exact' }).limit(5);
console.log('Error:', error?.message || 'none');
console.log('Count:', count);
console.log('Sample:', JSON.stringify(data?.slice(0, 2), null, 2));

// If table doesn't exist, create it
if (error?.message?.includes('does not exist') || error?.code === '42P01') {
  console.log('\nTable does not exist. Creating...');
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql: `
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
      CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
      CREATE INDEX IF NOT EXISTS idx_visitors_country ON visitors(country);
      ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow all visitors" ON visitors FOR ALL USING (true) WITH CHECK (true);
    `
  });
  if (rpcError) console.log('RPC error:', rpcError.message);
  else console.log('Table created!');
}
