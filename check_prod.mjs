// Check what anon key production is using
const res = await fetch('https://securedtampa.com');
const html = await res.text();

// Find JWTs in the page
const tokens = html.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
for (const t of tokens) {
  try {
    const payload = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
    if (payload.ref) console.log('Found Supabase key - ref:', payload.ref, 'role:', payload.role);
  } catch(e) {}
}

// Check if the correct project ref appears
console.log('Has correct project ref:', html.includes('wupfvvwypyvzkznekksw'));
