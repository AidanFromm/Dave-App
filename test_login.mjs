// Test login directly via the production sign-in server action
// by calling the Supabase auth endpoint with the same anon key the site uses

// First get the anon key from the JS bundle
const pageRes = await fetch('https://securedtampa.com/admin/login');
const html = await pageRes.text();

// Extract script sources
const scripts = [...html.matchAll(/src="([^"]*_next[^"]*)"/g)].map(m => m[1]);
console.log('Found', scripts.length, 'scripts');

// Check a few for the anon key
for (const src of scripts.slice(0, 5)) {
  const url = src.startsWith('http') ? src : 'https://securedtampa.com' + src;
  try {
    const res = await fetch(url);
    const js = await res.text();
    const tokens = js.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g) || [];
    for (const t of tokens) {
      try {
        const payload = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
        if (payload.ref) {
          console.log('FOUND KEY - ref:', payload.ref, 'role:', payload.role);
          console.log('Token:', t.substring(0, 50) + '...');
          
          // Now test login with this key
          const loginRes = await fetch(`https://${payload.ref}.supabase.co/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': t },
            body: JSON.stringify({ email: 'securedtampa.llc@gmail.com', password: 'Secured2026!' })
          });
          const loginData = await loginRes.json();
          console.log('Login result:', loginData.access_token ? 'SUCCESS' : 'FAIL -', loginData.msg);
        }
      } catch(e) {}
    }
  } catch(e) {}
}
