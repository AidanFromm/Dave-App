// Update Pokemon products with proper tags
const SUPABASE_URL = 'https://wupfvvwypyvzkznekksw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2OTMyMiwiZXhwIjoyMDg1NzQ1MzIyfQ.0dzNEm4ygSQUEUWuXQqXXzmsslvayB7xpXBWB1BTUVg';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// Pikachu - raw card
await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.372e654d-e699-4922-b9a2-e87c21122472`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ tags: ['pokemon', 'raw'], condition: 'new' })
});
console.log('Updated Pikachu - raw card');

// Mewtwo - raw card  
await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.cc4bae90-286e-4450-b7f9-25ddb4592f4f`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ tags: ['pokemon', 'raw'], condition: 'new' })
});
console.log('Updated Mewtwo - raw card');

// Charizard - graded PSA 10 (higher value suggests graded)
await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.2eb16ac5-8642-4613-b2ae-6d1eb43f0bf4`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ tags: ['pokemon', 'raw'], condition: 'new' })
});
console.log('Updated Charizard - raw card');

console.log('All Pokemon products updated with proper tags!');
