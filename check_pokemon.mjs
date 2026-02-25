import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('website/.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]
const srk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]
const sb = createClient(url, srk)

const { data } = await sb.from('products').select('id, name, category, pokemon_type, brand').ilike('name', '%pokemon%')
console.log(`Found ${data.length} products with "pokemon" in name:\n`)
for (const p of data) {
  console.log(`category=${p.category} | pokemon_type=${p.pokemon_type} | brand=${p.brand} | ${p.name}`)
}
