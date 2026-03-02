const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const sb = createClient(
  'https://ycmfjtrckakdfodmkzro.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljbWZqdHJja2FrZGZvZG1renJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTQ3MDQsImV4cCI6MjA4NjQzMDcwNH0.2_NwiARxOqemK7PBL8nUP4j--Y6sEMnMvapH74sGvEo'
);

(async () => {
  const { data: inv } = await sb.from('inventory_summary').select('variant_id,qty_on_hand,qty_reserved,avg_unit_cost');
  const vids = inv.map(d => d.variant_id);
  const { data: vars } = await sb.from('variants').select('id,product_id,size_text,variant_sku,wholesale_price').in('id', vids);
  const vm = Object.fromEntries(vars.map(v => [v.id, v]));
  const pids = [...new Set(vars.map(v => v.product_id))];
  const { data: prods } = await sb.from('products').select('id,name,brand,style_code,category').in('id', pids);
  const pm = Object.fromEntries(prods.map(p => [p.id, p]));

  const rows = inv.map(i => {
    const v = vm[i.variant_id] || {};
    const p = pm[v.product_id] || {};
    return {
      name: p.name || '', brand: p.brand || '', cat: p.category || '',
      sku: p.style_code || '', size: v.size_text || '',
      qty: i.qty_on_hand, reserved: i.qty_reserved,
      cost: i.avg_unit_cost, wholesale: v.wholesale_price || 0
    };
  }).filter(r => r.qty > 0).sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size, undefined, { numeric: true }));

  let csv = 'Product Name,Brand,Category,SKU,Size,Qty On Hand\n';
  let tu = 0;

  for (const r of rows) {
    const esc = s => '"' + s.replace(/"/g, '""') + '"';
    csv += [esc(r.name), esc(r.brand), esc(r.cat), esc(r.sku), esc(r.size), r.qty].join(',') + '\n';
    tu += r.qty;
  }

  csv += '\n,,,,TOTALS:,' + tu + '\n';

  const outPath = 'C:/Users/useva/.openclaw/workspace/jfk_inventory.csv';
  fs.writeFileSync(outPath, csv);
  console.log(rows.length + ' items, ' + tu + ' units');
})();
